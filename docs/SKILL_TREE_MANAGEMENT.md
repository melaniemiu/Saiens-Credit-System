# Skill Tree Data Management Guide

## Overview

The 山恩互動表彰系統 (Saiens Interactive Recognition System) includes a sophisticated skill tree management system that organizes employee development through job-based skill progression. This guide explains how to create, manage, and update the skill tree data structure.

## Database Schema

### Core Tables

#### 1. Skills Table
```sql
CREATE TABLE Skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  learningMethod VARCHAR(50) NOT NULL,
  assessmentMethod VARCHAR(50) NOT NULL,
  syllabus TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Jobs Table
```sql
CREATE TABLE Jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. JobSkills Table (Job-Skill Relationship)
```sql
CREATE TABLE JobSkills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobId INTEGER NOT NULL,
  skillId INTEGER NOT NULL,
  isRequired BOOLEAN DEFAULT FALSE,
  prerequisiteSkills TEXT, -- JSON array of skill IDs
  displayOrder INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jobId) REFERENCES Jobs(id),
  FOREIGN KEY (skillId) REFERENCES Skills(id)
);
```

#### 4. UserSkills Table (User Progress Tracking)
```sql
CREATE TABLE UserSkills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  skillId INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'not_started',
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  startedAt DATETIME,
  completedAt DATETIME,
  evaluatedAt DATETIME,
  evaluationRequestedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id),
  FOREIGN KEY (skillId) REFERENCES Skills(id)
);
```

## Skill Categories

The system supports the following skill categories:

| Category | Icon | Description | Color Theme |
|----------|------|-------------|-------------|
| 山恩DNA | Crown | 企業文化與核心價值 | Purple |
| 產品知識 | BookOpen | 產品相關專業知識 | Blue |
| 工具使用 | Sword | 工具操作與應用技能 | Green |
| 安裝知識 | Shield | 安裝作業相關技能 | Orange |
| 安全操作 | Zap | 安全規範與操作流程 | Red |

## Job Progression Hierarchy

The standard job progression follows this hierarchy:

1. **新手村** (Level 1) - Beginner Level
2. **助理工程師** (Level 2) - Assistant Engineer  
3. **正式工程師** (Level 3) - Engineer
4. **資深工程師** (Level 4) - Senior Engineer

## CSV Data Import Format

### Skills CSV Structure
```csv
技能名稱,類別,學習方式,評估方式,學習大綱
基礎產品知識,產品知識,線上,考卷考核,"產品概述\n功能介紹\n使用場景"
安全操作規範,安全操作,實體,實作考核,"安全檢查清單\n操作流程\n緊急處理"
```

### Job-Skill Mapping CSV Structure
```csv
職位名稱,職位等級,技能名稱,是否必修,前置技能,顯示順序
新手村,1,基礎產品知識,TRUE,,1
新手村,1,安全操作規範,TRUE,,2
助理工程師,2,進階產品知識,TRUE,基礎產品知識,1
```

## Data Seeding Scripts

### 1. Import Skills from CSV

```javascript
// backend/src/utils/import-skills.js
const fs = require('fs');
const csv = require('csv-parser');
const { Skill } = require('../models');

async function importSkillsFromCSV(csvFilePath) {
  const skills = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        skills.push({
          name: row['技能名稱'],
          category: row['類別'],
          learningMethod: row['學習方式'],
          assessmentMethod: row['評估方式'],
          syllabus: row['學習大綱']
        });
      })
      .on('end', async () => {
        try {
          await Skill.bulkCreate(skills, { ignoreDuplicates: true });
          console.log(`Imported ${skills.length} skills successfully`);
          resolve(skills);
        } catch (error) {
          reject(error);
        }
      });
  });
}

module.exports = { importSkillsFromCSV };
```

### 2. Create Job-Skill Relationships

```javascript
// backend/src/utils/setup-job-skills.js
const { Job, Skill, JobSkill } = require('../models');

async function setupJobSkillRelationships() {
  // Define job progression
  const jobs = [
    { name: '新手村', level: 1 },
    { name: '助理工程師', level: 2 },
    { name: '正式工程師', level: 3 },
    { name: '資深工程師', level: 4 }
  ];

  // Create jobs
  for (const jobData of jobs) {
    await Job.findOrCreate({
      where: { name: jobData.name },
      defaults: jobData
    });
  }

  // Define skill mappings
  const skillMappings = [
    // 新手村 skills
    { jobName: '新手村', skillName: '基礎產品知識', isRequired: true, order: 1 },
    { jobName: '新手村', skillName: '安全操作規範', isRequired: true, order: 2 },
    
    // 助理工程師 skills
    { jobName: '助理工程師', skillName: '進階產品知識', isRequired: true, order: 1, prerequisites: ['基礎產品知識'] },
    { jobName: '助理工程師', skillName: '工具操作基礎', isRequired: true, order: 2 },
    
    // Add more mappings as needed
  ];

  // Create job-skill relationships
  for (const mapping of skillMappings) {
    const job = await Job.findOne({ where: { name: mapping.jobName } });
    const skill = await Skill.findOne({ where: { name: mapping.skillName } });
    
    if (job && skill) {
      await JobSkill.findOrCreate({
        where: { jobId: job.id, skillId: skill.id },
        defaults: {
          isRequired: mapping.isRequired,
          displayOrder: mapping.order,
          prerequisiteSkills: JSON.stringify(mapping.prerequisites || [])
        }
      });
    }
  }
}

module.exports = { setupJobSkillRelationships };
```

## Skill Tree Positioning Algorithm

### Mobile-First Positioning
The skill tree uses a mobile-optimized positioning algorithm:

```javascript
// Calculate position based on job level and skill category
const baseRadius = 80 + (jobLevel * 60); // Smaller base radius for mobile
const skillsPerLevel = skillsInJob.length;
const angleStep = (2 * Math.PI) / skillsPerLevel;
const angle = skillIndex * angleStep - Math.PI / 2;

// Add category-based offset for better separation
const categoryIndex = getCategoryIndex(category);
const categoryOffset = (categoryIndex * 20) - 40;
const radius = baseRadius + categoryOffset;

const x = Math.cos(angle) * radius;
const y = Math.sin(angle) * radius + (jobLevel * 150); // Reduced spacing for mobile
```

## Dependency Management

### Prerequisite Logic
Skills can have prerequisites that must be completed before they become available:

```javascript
// Basic prerequisite logic: skills from previous job levels
const prerequisiteSkillIds = jobIndex > 0 
  ? jobProgression[jobIndex - 1].skillsWithProgress
      ?.filter((prevSkill) => prevSkill.isRequired)
      ?.map((prevSkill) => prevSkill.skillId) || []
  : [];

// Check if skill is unlocked
isUnlocked: (completed) => {
  return prerequisiteSkillIds.every(prereqId => 
    completed.includes(prereqId)
  );
}
```

### Connection Types
The system supports multiple connection types:

- **prerequisite**: Direct skill dependency
- **sequence**: Sequential learning path
- **related**: Skills in the same category
- **job_progression**: Skills that span job levels

## API Endpoints for Skill Management

### Get User Skill Progression
```javascript
GET /api/skills/user
Response: {
  userSkills: [...],
  jobProgression: [...],
  suggestedSkills: [...],
  dependencies: [...]
}
```

### Update Skill Progress
```javascript
PUT /api/skills/:skillId/progress
Body: {
  status: 'in_progress' | 'completed',
  score: number,
  startedAt: datetime
}
```

### Get Department Progression
```javascript
GET /api/users/department-progression
Response: {
  department: {...},
  currentJob: {...},
  jobProgression: [...]
}
```

## Best Practices

### 1. Skill Creation Guidelines
- Use clear, descriptive skill names
- Assign appropriate categories for visual grouping
- Define realistic learning and assessment methods
- Include comprehensive syllabi for learning guidance

### 2. Job-Skill Mapping
- Balance required vs optional skills per job level
- Ensure logical prerequisite chains
- Consider skill complexity when ordering
- Regular review and updates based on organizational needs

### 3. Mobile Optimization
- Keep skill node sizes appropriate for touch interaction
- Use responsive spacing and positioning
- Optimize for common mobile screen sizes
- Implement touch-friendly navigation controls

### 4. Performance Considerations
- Use pagination for large skill sets
- Implement caching for frequently accessed data
- Optimize database queries with proper indexing
- Use memoization for expensive calculations

## Troubleshooting

### Common Issues

1. **Skills not appearing in tree**
   - Check job-skill relationships exist
   - Verify user has assigned job position
   - Ensure skill categories are valid

2. **Incorrect prerequisite behavior**
   - Validate prerequisite skill IDs
   - Check completion status calculations
   - Review dependency logic implementation

3. **Mobile rendering issues**
   - Test on actual mobile devices
   - Verify responsive CSS classes
   - Check touch event handling

### Database Maintenance

Regular maintenance tasks:
- Clean up orphaned skill records
- Update skill content based on feedback
- Rebalance job-skill distributions
- Monitor user progress patterns

## Future Enhancements

Planned improvements:
- Advanced prerequisite chains (AND/OR logic)
- Skills from external learning platforms
- AI-powered skill recommendations
- Gamification elements (badges, achievements)
- Team-based skill challenges
- Integration with performance reviews