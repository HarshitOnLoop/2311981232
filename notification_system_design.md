# Campus Hiring Evaluation - Full Stack System Design

## Stage 1: REST API Design & Real-time Mechanism

### Core Actions
1. **Fetch Notifications**: Retrieve a list of notifications for the logged-in student.
2. **Mark as Read**: Update the status of a specific notification.
3. **Mark All as Read**: Update all unread notifications for the user.
4. **Delete Notification**: Remove a notification from the user's view.

### REST API Endpoints

#### 1. Fetch Notifications
- **Endpoint**: `GET /api/v1/notifications`
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `page` (integer), `limit` (integer), `type` (enum), `is_read` (boolean)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1234",
      "type": "Placement",
      "message": "Advanced Micro Devices Inc. hiring",
      "is_read": false,
      "created_at": "2026-04-22T17:49:42Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

#### 2. Mark Notification as Read
- **Endpoint**: `PUT /api/v1/notifications/:id/read`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: None (implicitly sets is_read to true)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "is_read": true,
    "updated_at": "2026-04-22T18:00:00Z"
  }
}
```

#### 3. Mark All as Read
- **Endpoint**: `PUT /api/v1/notifications/read-all`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "updated_count": 15
  }
}
```

### Real-time Notification Mechanism
To deliver real-time notifications to users seamlessly, we use **WebSockets**.
1. When a user logs in, the frontend establishes a persistent WebSocket connection to `ws://server/ws`.
2. The connection is authenticated using a token passed during the handshake.
3. When a new event occurs (e.g., HR triggers a placement notification), the backend persists the notification to the database and immediately broadcasts the JSON payload over the WebSocket connection to the specific user's active socket.
4. The frontend listens for the `new_notification` event and updates the UI state (e.g., incrementing the unread badge and showing a toast notification) without requiring a page refresh.

---

## Stage 2: Persistent Storage

### Storage Choice: Relational Database (PostgreSQL)
We choose PostgreSQL because notifications have a structured schema, require ACID compliance (especially for "read" status to avoid inconsistencies), and need to support complex querying (filtering by type, read status, and pagination).

### DB Schema
**Table**: `notifications`
- `id` (UUID, Primary Key)
- `student_id` (String/UUID, Indexed)
- `type` (Enum: 'Event', 'Result', 'Placement')
- `message` (Text)
- `is_read` (Boolean, Default: false)
- `created_at` (Timestamp, Indexed)
- `updated_at` (Timestamp)

### Data Volume Challenges & Solutions
As data grows (e.g., millions of records):
1. **Problem**: Slow query performance.
   **Solution**: Implement Indexing on frequently queried fields (`student_id`, `is_read`, `created_at`).
2. **Problem**: Storage costs and table bloat.
   **Solution**: **Data Partitioning**: Partition the notifications table by `created_at` (e.g., monthly partitions) to keep active indexes small.
3. **Problem**: Infinite growth of stale data.
   **Solution**: **Archival/TTL**: Move notifications older than 6 months to cold storage (e.g., S3) or a separate historical table, and delete them from the main active table.

---

## Stage 3: Query Analysis

### Original Query
```sql
SELECT * FROM notifications 
WHERE studentID = 1042 AND isRead = false 
ORDER BY createdAt ASC;
```

**Why is it slow?**
If there are 5,000,000 notifications and no composite index exists for `(studentID, isRead, createdAt)`, the database might perform a full table scan or a suboptimal index scan. Even if `studentID` is indexed, the database still has to fetch all records for the student, filter by `isRead`, and sort by `createdAt`.

**Improvements & Indexes:**
Adding indexes on *every* column is a bad idea because it severely degrades write performance (INSERT/UPDATE operations take longer as every index must be updated) and consumes unnecessary disk space.

A safe and effective index for this specific query is a **Composite Index**:
```sql
CREATE INDEX idx_student_unread_created ON notifications(studentID, isRead, createdAt);
```
This index perfectly covers the `WHERE` clause and the `ORDER BY` clause, allowing the database to instantly locate the relevant rows already sorted.

### Query for Placement Notifications
```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notification_type = 'Placement';
```
*(An index on `notification_type` would make this query highly efficient).*

---

## Stage 4: Overwhelmed Database on Page Load

### The Problem
Fetching notifications from the DB on every single page load for 50,000 students generates massive read traffic, overwhelming the database connections and CPU.

### Strategies to Improve Performance

1. **Caching (Redis)**
   - **How**: Store the unread notification count and the first page of notifications for each user in an in-memory cache like Redis.
   - **Tradeoffs**: High performance and massively reduced DB load. However, it introduces cache invalidation complexity (the cache must be updated whenever a notification is read or received) and requires additional infrastructure.

2. **Pagination / Infinite Scroll**
   - **How**: Do not fetch all notifications at once. Fetch only the top 10 using `LIMIT 10 OFFSET 0`.
   - **Tradeoffs**: Reduces the payload size and DB work per query, but doesn't prevent the DB hit from occurring on every page load.

3. **WebSocket State Hydration**
   - **How**: Instead of polling the DB on every page navigation, the Single Page Application (React) fetches the notifications *once* on initial load and relies on the WebSocket connection to maintain the state.
   - **Tradeoffs**: Extremely efficient for the DB, but relies heavily on the client keeping the state in memory. If the user refreshes manually, a DB hit still occurs.

**Suggested Solution**: A combination of Redis caching for the unread count/top 10 notifications, combined with a WebSocket-driven SPA frontend.

---

## Stage 5: "Notify All" 50,000 Students

### Shortcomings of the Pseudo-code
```python
function notify_all(student_ids, message):
  for student_id in student_ids:
    send_email(student_id, message) # Synchronous external API call
    save_to_db(student_id, message)
    push_to_app(student_id, message)
```
1. **Synchronous Execution**: The loop processes one student at a time. If `send_email` takes 500ms, 50,000 students will take 7 hours!
2. **Lack of Fault Tolerance**: If `send_email` fails at student 200, the loop crashes. The remaining 49,800 students get nothing, and there is no tracking of who received it and who didn't.
3. **Partial Failures**: If `send_email` succeeds but `save_to_db` fails, the system is in an inconsistent state.
4. **Database Connection Exhaustion**: 50,000 rapid sequential DB inserts can overwhelm the connection pool.

### Redesign: Asynchronous Message Queue Pattern
The process of saving to the DB and sending emails should be decoupled using an event-driven architecture with a message broker (e.g., RabbitMQ, AWS SQS, or Kafka).

**Why separate them?**
Saving to the DB must be fast and reliable. Email APIs are notoriously slow, subject to rate limits, and prone to timeouts. Decoupling them allows the app to feel instant for the HR user, while emails are processed safely in the background with automatic retries.

### Revised Architecture Pseudo-code
```python
# 1. Producer: Fast, bulk operations
function notify_all(student_ids, message):
  # Bulk insert into DB (1 query instead of 50,000)
  bulk_save_to_db(student_ids, message)
  
  # Broadcast to connected WebSockets immediately
  bulk_push_to_app(student_ids, message)
  
  # Push events to a Message Queue for email processing
  for student_id in student_ids:
    enqueue_message("email_queue", {student_id, message})

# 2. Consumer (Worker Node): Processes emails asynchronously
function process_email_queue():
  while job = dequeue_message("email_queue"):
    try:
      send_email(job.student_id, job.message)
      mark_job_complete(job)
    except EmailAPIError:
      # Automatically retry later or move to Dead Letter Queue
      retry_job_later(job)
```

---

## Stage 6: Priority Inbox Implementation

We have implemented the logic to sort and return the top 10 most important notifications based on type (Placement > Result > Event) and recency. 

### Approach to maintaining Top 10 efficiently
1. **Weights**: We assign a numerical weight to each notification type:
   - `Placement`: 3
   - `Result`: 2
   - `Event`: 1
2. **Sorting Logic**: When notifications are fetched from the API, we parse the `Timestamp` into a Unix epoch. We then sort the array first by the assigned weight (descending) and then by the timestamp (descending).
3. **Efficiency**: To maintain the top 10 efficiently without sorting the entire dataset every time a new notification arrives, we can use a **Min-Heap (Priority Queue)** data structure. As new notifications stream in via WebSockets, we insert them into the heap based on their composite priority score (weight + timestamp). If the heap exceeds 10 items, we extract the minimum. This keeps the insertion time complexity to `O(log 10) = O(1)`, making real-time updates extremely fast.

*(For the code implementation and screenshots, please refer to the `notification_app_be/src/service/priorityService.ts` file and the repository's frontend pages).*

---

## Stage 7: Frontend Application

The responsive frontend application has been built using **Next.js** and **React**. 
- It uses **Vanilla CSS** with a robust design system to avoid Material UI and external libraries, ensuring high code quality and native performance.
- It includes a **Dashboard** that lists all notifications and a separate **Priority Inbox** page that leverages the Stage 6 logic.
- It integrates seamlessly with the provided Affordmed Test Server APIs for both general notification retrieval and priority filtering.
