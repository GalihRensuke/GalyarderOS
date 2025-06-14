# GalyarderOS Backend API Documentation

## Overview

This document provides comprehensive documentation for the GalyarderOS backend API architecture. The system is built with TypeScript, Supabase, and follows RESTful API design principles.

## Architecture Overview

### Core Modules

1. **Ritual Engine** - Habit tracking and ritual sequences
2. **Flow State Command** - Focus session management and optimization
3. **Knowledge Synthesis** - Note-taking and knowledge management
4. **Reflection Intelligence** - Journaling and insight generation
5. **Life Analytics** - Metrics tracking and reporting

### Technology Stack

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **API Layer**: TypeScript with Supabase client
- **Real-time**: Supabase Realtime
- **Testing**: Vitest
- **Type Safety**: Full TypeScript coverage

## Authentication

All API endpoints require authentication via Supabase Auth. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Row Level Security (RLS)

All tables implement RLS policies ensuring users can only access their own data.

## API Endpoints

### Ritual Engine API

#### Create Ritual
```typescript
POST /api/rituals
Content-Type: application/json

{
  "name": "Morning Meditation",
  "description": "Daily meditation practice",
  "category": "mindfulness",
  "type": "habit",
  "frequency": "daily",
  "duration_minutes": 20,
  "difficulty_level": 3,
  "tags": ["meditation", "mindfulness"],
  "reminder_enabled": true
}
```

#### Get Rituals
```typescript
GET /api/rituals?page=1&limit=20&category=mindfulness&is_active=true

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Morning Meditation",
      "category": "mindfulness",
      "streak_count": 15,
      "total_completions": 45,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Complete Ritual
```typescript
POST /api/rituals/{id}/complete

{
  "duration_minutes": 25,
  "mood_before": 6,
  "mood_after": 8,
  "energy_before": 5,
  "energy_after": 7,
  "notes": "Great session today",
  "completed_steps": ["step1", "step2"],
  "skipped_steps": []
}
```

#### Get Ritual Analytics
```typescript
GET /api/rituals/{id}/analytics?timeRange=30d

Response:
{
  "success": true,
  "data": {
    "totalCompletions": 25,
    "averages": {
      "moodBefore": 6.2,
      "moodAfter": 7.8,
      "duration": 22.5
    },
    "improvements": {
      "moodImprovement": 1.6,
      "energyImprovement": 1.2
    },
    "consistency": 0.83
  }
}
```

### Flow State API

#### Create Flow Session
```typescript
POST /api/flow-sessions

{
  "name": "Deep Work Session",
  "type": "deep_work",
  "planned_duration": 90,
  "environment_settings": {
    "noise_level": "ambient",
    "lighting": "natural",
    "music_enabled": true,
    "notifications_blocked": true,
    "website_blocking_enabled": true,
    "blocked_websites": ["facebook.com", "twitter.com"]
  },
  "tags": ["work", "coding"]
}
```

#### Start Flow Session
```typescript
POST /api/flow-sessions/{id}/start

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "start_time": "2024-01-01T09:00:00Z"
  }
}
```

#### Record Distraction
```typescript
POST /api/flow-sessions/{id}/distractions

{
  "type": "notification",
  "source": "email",
  "duration_seconds": 30,
  "timestamp": "2024-01-01T09:15:00Z"
}
```

#### Get Flow Analytics
```typescript
GET /api/flow-sessions/analytics?timeRange=30d

Response:
{
  "success": true,
  "data": {
    "totalSessions": 45,
    "totalFocusTime": 3600,
    "averageSessionLength": 80,
    "averageFocusScore": 8.2,
    "sessionsByType": {
      "deep_work": 25,
      "creative": 15,
      "learning": 5
    }
  }
}
```

### Knowledge Synthesis API

#### Create Knowledge Node
```typescript
POST /api/knowledge/nodes

{
  "title": "Machine Learning Fundamentals",
  "content": "Detailed notes about ML concepts...",
  "type": "note",
  "source": "Course: CS229",
  "author": "Andrew Ng",
  "tags": ["machine-learning", "ai", "algorithms"],
  "category": "education",
  "importance_score": 8
}
```

#### Search Knowledge
```typescript
GET /api/knowledge/search?query=machine learning&types=note,article&limit=20

Response:
{
  "success": true,
  "data": [
    {
      "node": {
        "id": "uuid",
        "title": "Machine Learning Fundamentals",
        "content": "...",
        "relevance_score": 0.95
      },
      "snippet": "Machine learning is a subset of artificial intelligence...",
      "highlighted_terms": ["machine", "learning"]
    }
  ]
}
```

#### Create Knowledge Connection
```typescript
POST /api/knowledge/connections

{
  "source_node_id": "uuid1",
  "target_node_id": "uuid2",
  "connection_type": "builds_on",
  "strength": 0.8,
  "description": "Advanced concepts build on fundamentals"
}
```

### Reflection Intelligence API

#### Create Reflection Entry
```typescript
POST /api/reflections

{
  "type": "daily",
  "title": "Daily Reflection - Jan 1st",
  "content": "Today was productive. I completed my morning routine...",
  "mood_score": 8,
  "energy_score": 7,
  "satisfaction_score": 9,
  "key_insights": ["Consistency in routine improves mood"],
  "action_items": ["Wake up 15 minutes earlier"],
  "gratitude_items": ["Good health", "Supportive family"],
  "challenges_faced": ["Time management"],
  "wins_celebrated": ["Completed all planned tasks"],
  "tags": ["productivity", "routine"]
}
```

#### Generate Dynamic Prompt
```typescript
POST /api/reflections/prompts/generate

{
  "recent_entries": [...],
  "current_goals": [...],
  "mood_trend": "improving",
  "focus_area": "productivity"
}

Response:
{
  "success": true,
  "data": {
    "question": "What patterns do you notice in your productivity lately?",
    "sub_questions": [
      "What triggers your most productive states?",
      "How can you replicate these conditions more often?"
    ],
    "context": "Based on your recent focus on productivity improvements",
    "difficulty_level": 3
  }
}
```

#### Get Reflection Analytics
```typescript
GET /api/reflections/analytics?timeRange=30d

Response:
{
  "success": true,
  "data": {
    "total_entries": 28,
    "consistency_score": 93,
    "average_mood": 7.2,
    "mood_trend": "improving",
    "common_themes": ["productivity", "health", "relationships"],
    "growth_areas": ["time management", "stress reduction"]
  }
}
```

### Life Analytics API

#### Record Metric
```typescript
POST /api/analytics/metrics

{
  "category": "physical",
  "name": "weight",
  "value": 75.5,
  "unit": "kg",
  "target_value": 73.0,
  "measurement_type": "gauge",
  "data_source": "manual"
}
```

#### Get Life Overview
```typescript
GET /api/analytics/overview?timeRange=30d

Response:
{
  "success": true,
  "data": {
    "totalMetrics": 450,
    "categories": {
      "physical": {
        "average": 7.8,
        "trend": "improving",
        "count": 120
      },
      "mental": {
        "average": 8.2,
        "trend": "stable",
        "count": 95
      }
    },
    "topPerformingAreas": ["mental", "spiritual"],
    "areasNeedingAttention": ["financial"]
  }
}
```

#### Generate Personal Report
```typescript
POST /api/analytics/reports

{
  "type": "weekly",
  "date": "2024-01-07"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "weekly",
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-01-07T23:59:59Z",
    "summary": "This week showed excellent progress in physical and mental domains...",
    "key_metrics": {...},
    "achievements": ["Completed all planned workouts", "Maintained meditation streak"],
    "recommendations": ["Focus more on financial planning", "Increase social activities"]
  }
}
```

## Error Handling

All API responses follow a consistent error format:

```typescript
{
  "success": false,
  "error": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Standard endpoints**: 100 requests per minute
- **Analytics endpoints**: 50 requests per minute
- **AI-powered endpoints**: 20 requests per minute

## Data Types and Validation

### Common Validation Rules

- **UUIDs**: Must be valid UUID v4 format
- **Timestamps**: ISO 8601 format
- **Scores**: Integer between 1-10
- **Text fields**: Maximum 10,000 characters
- **Arrays**: Maximum 100 items
- **Enum values**: Must match predefined options

### Input Sanitization

All text inputs are automatically sanitized to prevent XSS attacks:
- HTML tags are stripped
- Special characters are escaped
- Maximum length limits enforced

## Performance Considerations

### Pagination

All list endpoints support pagination:
- Default page size: 20 items
- Maximum page size: 100 items
- Use `page` and `limit` query parameters

### Caching

- Static data cached for 1 hour
- User-specific data cached for 5 minutes
- Real-time data not cached

### Database Optimization

- Proper indexing on frequently queried columns
- Connection pooling for scalability
- Query optimization for complex analytics

## Testing

### Unit Tests

Run the test suite:
```bash
npm run test
```

### Integration Tests

Test API endpoints:
```bash
npm run test:integration
```

### Coverage

Generate coverage report:
```bash
npm run test:coverage
```

## Security

### Authentication

- JWT tokens with 24-hour expiration
- Refresh token rotation
- Secure token storage

### Authorization

- Row Level Security (RLS) on all tables
- User-based access control
- Resource ownership validation

### Data Protection

- Encryption at rest
- TLS 1.3 for data in transit
- Regular security audits

## Monitoring and Logging

### Metrics Tracked

- API response times
- Error rates
- User activity patterns
- Database performance

### Logging

- Structured JSON logs
- Error tracking with stack traces
- User action audit trails

## Deployment

### Environment Variables

Required environment variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Database Migrations

Run migrations:
```bash
supabase db push
```

### Health Checks

Monitor API health:
```
GET /api/health
```

## Support

For API support and questions:
- Documentation: [API Docs](https://docs.galyarderos.com)
- Issues: [GitHub Issues](https://github.com/galyarderos/issues)
- Email: api-support@galyarderos.com