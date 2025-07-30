const dotenv = require("dotenv");
dotenv.config();
const { sequelize, Department, User, Job, Skill, JobSkill, UserSkill, Config } = require("../models");
const { parseSkillsCsv } = require("./parse-skills-csv");
// Seeds the database with initial data
async function seed() {
  try {
    // Check if we should force sync (drop all tables)
    const forceDrop = process.argv.includes("--force");

    if (forceDrop) {
      // Sync database (force: true will drop tables and recreate them)
      console.log("⚠️ WARNING: Dropping all tables and recreating schema...");
      await sequelize.sync({ force: true });
      console.log("Database synced and recreated");
    } else {
      console.log("Using existing database schema (no force sync)");
      await sequelize.sync({ force: false });
      console.log("Database synced without dropping tables");
    }

    // Check if departments already exist
    const existingDeptCount = await Department.count();
    let departments = [];

    if (existingDeptCount > 0 && !forceDrop) {
      console.log(
        `Found ${existingDeptCount} existing departments, skipping department creation`
      );
      // Get existing departments
      departments = await Department.findAll();
    } else {
      // Create departments
      departments = await Department.bulkCreate([
        { name: "工程部", description: "負責公司的技術開發與維護" },
        { name: "行銷部", description: "負責公司的營銷策略與執行" },
        { name: "人資部", description: "負責公司的人員管理與招聘" },
        { name: "財務部", description: "負責公司的財務管理與規劃" },
        { name: "客服部", description: "負責客戶服務與支援" },
        { name: "設計部", description: "負責產品與視覺設計" },
      ]);

      console.log(`Created ${departments.length} departments`);
    }

    // Map department names to IDs for easier reference
    const deptMap = {};
    departments.forEach((dept) => {
      console.log(`Department: ${dept.name}, ID: ${dept.id}`);
      deptMap[dept.name] = dept.id;
    });

    // Debug: Print the department map
    console.log("Department Map:", deptMap);

    // Create jobs for each department
    const existingJobCount = await Job.count();
    let jobs = [];
    let jobMap = {};

    if (existingJobCount > 0 && !forceDrop) {
      console.log(
        `Found ${existingJobCount} existing jobs, skipping job creation`
      );
      // Get existing jobs
      jobs = await Job.findAll();
    } else {
      // Create specific engineering jobs based on CSV document
      const engineeringJobs = ["新手村", "初階助理工程師", "進階助理工程師", "正式工程師", "資深工程師"];
      const engineeringDeptId = deptMap["工程部"];
      
      for (const jobName of engineeringJobs) {
        const job = await Job.create({ 
          name: jobName, 
          departmentId: engineeringDeptId 
        });
        jobs.push(job);
        jobMap[jobName] = job.id;
        console.log(`Created job: ${jobName}, ID: ${job.id}, Department: 工程部`);
      }
      
      // Add logistics jobs based on CSV
      const logisticsDept = await Department.create({ 
        name: "物流部", 
        description: "負責物流管理與配送" 
      });
      departments.push(logisticsDept);
      deptMap["物流部"] = logisticsDept.id;
      
      const logisticsJobs = ["助理物流", "正式物流", "物流主管"];
      for (const jobName of logisticsJobs) {
        const job = await Job.create({ 
          name: jobName, 
          departmentId: logisticsDept.id 
        });
        jobs.push(job);
        jobMap[jobName] = job.id;
        console.log(`Created job: ${jobName}, ID: ${job.id}, Department: 物流部`);
      }

      // Create jobs for other departments with generic variants
      const otherDeptJobSuffixes = ["初心者", "玩家", "大師"];
      
      for (const dept of departments) {
        const deptNameBase = dept.name.replace("部", "");
        
        // Skip engineering department as we already created specific jobs
        if (deptNameBase === "工程") continue;
        
        for (const suffix of otherDeptJobSuffixes) {
          const jobName = `${deptNameBase}${suffix}`;
          const job = await Job.create({ 
            name: jobName, 
            departmentId: dept.id 
          });
          jobs.push(job);
          jobMap[jobName] = job.id;
          console.log(`Created job: ${jobName}, ID: ${job.id}, Department: ${dept.name}`);
        }
      }

      console.log(`Created ${jobs.length} jobs`);
    }

    // If we loaded existing jobs, build the jobMap
    if (existingJobCount > 0 && !forceDrop) {
      jobs.forEach((job) => {
        jobMap[job.name] = job.id;
      });
    }

    // Set up job hierarchy (nextJobId relationships)
    console.log("Setting up job hierarchy...");
    
    // Engineering progression: 新手村 → 初階助理工程師 → 進階助理工程師 → 正式工程師 → 資深工程師
    if (jobMap["新手村"] && jobMap["初階助理工程師"]) {
      await Job.update({ nextJobId: jobMap["初階助理工程師"] }, { where: { id: jobMap["新手村"] } });
    }
    if (jobMap["初階助理工程師"] && jobMap["進階助理工程師"]) {
      await Job.update({ nextJobId: jobMap["進階助理工程師"] }, { where: { id: jobMap["初階助理工程師"] } });
    }
    if (jobMap["進階助理工程師"] && jobMap["正式工程師"]) {
      await Job.update({ nextJobId: jobMap["正式工程師"] }, { where: { id: jobMap["進階助理工程師"] } });
    }
    if (jobMap["正式工程師"] && jobMap["資深工程師"]) {
      await Job.update({ nextJobId: jobMap["資深工程師"] }, { where: { id: jobMap["正式工程師"] } });
    }
    
    // Logistics progression: 助理物流 → 正式物流 → 物流主管
    if (jobMap["助理物流"] && jobMap["正式物流"]) {
      await Job.update({ nextJobId: jobMap["正式物流"] }, { where: { id: jobMap["助理物流"] } });
    }
    if (jobMap["正式物流"] && jobMap["物流主管"]) {
      await Job.update({ nextJobId: jobMap["物流主管"] }, { where: { id: jobMap["正式物流"] } });
    }
    
    // Other departments progression: 初心者 → 玩家 → 大師
    for (const dept of departments) {
      const deptNameBase = dept.name.replace("部", "");
      if (deptNameBase === "工程") continue; // Skip engineering as we handled it above
      
      const level1 = `${deptNameBase}初心者`;
      const level2 = `${deptNameBase}玩家`;
      const level3 = `${deptNameBase}大師`;
      
      if (jobMap[level1] && jobMap[level2]) {
        await Job.update({ nextJobId: jobMap[level2] }, { where: { id: jobMap[level1] } });
      }
      if (jobMap[level2] && jobMap[level3]) {
        await Job.update({ nextJobId: jobMap[level3] }, { where: { id: jobMap[level2] } });
      }
    }
    
    console.log("Job hierarchy setup completed");

    // Create skills based on the CSV data
    const existingSkillCount = await Skill.count();
    let skills = [];
    let skillMap = {};

    if (existingSkillCount > 0 && !forceDrop) {
      console.log(
        `Found ${existingSkillCount} existing skills, skipping skill creation`
      );
      skills = await Skill.findAll();
    } else {
      console.log("Parsing skills from CSV file...");
      const { skills: csvSkills } = parseSkillsCsv();
      
      console.log(`Parsed ${csvSkills.length} skills from CSV`);
      skills = await Skill.bulkCreate(csvSkills);
      console.log(`Created ${skills.length} skills with syllabus content`);
    }

    // Build skill map
    if (existingSkillCount > 0 && !forceDrop) {
      skills.forEach((skill) => {
        skillMap[skill.name] = skill.id;
      });
    } else {
      skills.forEach((skill) => {
        skillMap[skill.name] = skill.id;
      });
    }

    // Create job-skill associations based on CSV data
    const existingJobSkillCount = await JobSkill.count();
    
    if (existingJobSkillCount === 0 || forceDrop) {
      console.log("Creating job-skill associations...");
      
      // Get CSV mappings and combine with custom mappings for non-engineering jobs
      const { jobSkillMappings: csvMappings } = parseSkillsCsv();
      
      // Add custom mappings for non-engineering jobs
      const customMappings = {
        // 行銷部 jobs
        "行銷初心者": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程"],
        "行銷玩家": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "領導力與溝通 管理工具與管理思維"],
        "行銷大師": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "領導力與溝通 管理工具與管理思維", "領導力與溝通 有效溝通與問題解決"],
        
        // 人資部 jobs
        "人資初心者": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程"],
        "人資玩家": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "領導力與溝通 管理工具與管理思維"],
        "人資大師": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "領導力與溝通 管理工具與管理思維", "領導力與溝通 有效溝通與問題解決"],
        
        // 財務部 jobs
        "財務初心者": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程"],
        "財務玩家": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程"],
        "財務大師": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程"],
        
        // 客服部 jobs
        "客服初心者": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程"],
        "客服玩家": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "領導力與溝通 管理工具與管理思維"],
        "客服大師": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "領導力與溝通 管理工具與管理思維", "領導力與溝通 有效溝通與問題解決"],
        
        // 設計部 jobs
        "設計初心者": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程"],
        "設計玩家": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "產品知識 基本產品知識"],
        "設計大師": ["山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "產品知識 基本產品知識", "產品知識 石材的特性"]
      };
      
      // Combine CSV mappings with custom mappings
      const allMappings = { ...csvMappings, ...customMappings };
      
      // Convert to array format for processing
      const jobSkillMappings = Object.entries(allMappings).map(([jobName, skills]) => ({
        jobName,
        skills
      }));

      const jobSkillAssociations = [];
      
      for (const mapping of jobSkillMappings) {
        // Find job by exact name
        const job = jobs.find(j => j.name === mapping.jobName);
        if (!job) {
          console.log(`Warning: Job '${mapping.jobName}' not found`);
          continue;
        }

        for (const skillName of mapping.skills) {
          const skillId = skillMap[skillName];
          if (!skillId) {
            console.log(`Warning: Skill '${skillName}' not found in skillMap`);
            continue;
          }

          jobSkillAssociations.push({
            jobId: job.id,
            skillId: skillId,
            isRequired: true // Default to required, could be refined based on CSV data
          });
        }
      }

      if (jobSkillAssociations.length > 0) {
        await JobSkill.bulkCreate(jobSkillAssociations);
        console.log(`Created ${jobSkillAssociations.length} job-skill associations`);
      }
    } else {
      console.log(`Found ${existingJobSkillCount} existing job-skill associations, skipping creation`);
    }


    // Let's try a direct approach to department assignment
    // First, find departments by their names
    const engineeringDept = await Department.findOne({
      where: { name: "工程部" },
    });
    const marketingDept = await Department.findOne({
      where: { name: "行銷部" },
    });
    const hrDept = await Department.findOne({ where: { name: "人資部" } });
    const financeDept = await Department.findOne({ where: { name: "財務部" } });
    const customerDept = await Department.findOne({
      where: { name: "客服部" },
    });
    const designDept = await Department.findOne({ where: { name: "設計部" } });

    // Verify departments were found
    console.log("Department objects:", {
      engineering: engineeringDept ? engineeringDept.id : null,
      marketing: marketingDept ? marketingDept.id : null,
      hr: hrDept ? hrDept.id : null,
      finance: financeDept ? financeDept.id : null,
      customer: customerDept ? customerDept.id : null,
      design: designDept ? designDept.id : null,
    });

    // Direct verification of department attributes
    if (engineeringDept) {
      console.log("Engineering department details:", {
        id: engineeringDept.id,
        name: engineeringDept.name,
        raw: JSON.stringify(engineeringDept.toJSON()),
      });
    } else {
      console.log("WARNING: Engineering department not found!");
    }

    // Check if users already exist
    const existingUserCount = await User.count();
    let users = [];

    if (existingUserCount > 0 && !forceDrop) {
      console.log(
        `Found ${existingUserCount} existing users, skipping user creation`
      );
      users = await User.findAll();
      console.log(`Retrieved ${users.length} existing users`);
      return;
    }

    // Create users one by one to ensure proper department assignment
    // User 1 - Admin - Engineering (higher daily limit)
    const user1 = await User.create({
      employeeId: "EMP001",
      name: "王小明",
      email: "xiaoming.wang@example.com",
      lineUserId: "Uee2c366a945ff70af0323c51f509fb0e",
      departmentId: engineeringDept ? engineeringDept.id : null,
      jobId: jobMap["正式工程師"] || null, // Admin gets engineering job
      role: "admin",
      remainingDailyCredits: 10,
      dailyCreditLimit: 10, // Admin gets more credits
      dailyCreditResetDate: new Date(),
    });
    console.log("User 1 created with departmentId:", user1.departmentId, "jobId:", user1.jobId);

    // User 2 - Marketing
    const user2 = await User.create({
      employeeId: "EMP002",
      name: "李大華",
      email: "dahua.lee@example.com",
      departmentId: marketingDept ? marketingDept.id : null,
      jobId: jobMap["行銷玩家"] || null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5, // Standard user limit
      dailyCreditResetDate: new Date(),
    });
    console.log("User 2 created with departmentId:", user2.departmentId, "jobId:", user2.jobId);

    // User 3 - HR
    const user3 = await User.create({
      employeeId: "EMP003",
      name: "張美玲",
      email: "meiling.zhang@example.com",
      departmentId: hrDept ? hrDept.id : null,
      jobId: jobMap["人資大師"] || null,
      role: "user",
      remainingDailyCredits: 7,
      dailyCreditLimit: 7, // HR gets slightly more
      dailyCreditResetDate: new Date(),
    });
    console.log("User 3 created with departmentId:", user3.departmentId, "jobId:", user3.jobId);

    // User 4 - Finance
    const user4 = await User.create({
      employeeId: "EMP004",
      name: "陳志明",
      email: "zhiming.chen@example.com",
      departmentId: financeDept ? financeDept.id : null,
      jobId: jobMap["財務玩家"] || null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5, // Standard user limit
      dailyCreditResetDate: new Date(),
    });
    console.log("User 4 created with departmentId:", user4.departmentId, "jobId:", user4.jobId);

    // User 5 - Customer Service
    const user5 = await User.create({
      employeeId: "EMP005",
      name: "林小芳",
      email: "xiaofang.lin@example.com",
      departmentId: customerDept ? customerDept.id : null,
      jobId: jobMap["客服大師"] || null,
      role: "user",
      remainingDailyCredits: 8,
      dailyCreditLimit: 8, // Customer service gets more for client appreciations
      dailyCreditResetDate: new Date(),
    });
    console.log("User 5 created with departmentId:", user5.departmentId, "jobId:", user5.jobId);

    // User 6 - Engineering
    const user6 = await User.create({
      employeeId: "EMP006",
      name: "黃建國",
      email: "jianguo.huang@example.com",
      departmentId: engineeringDept ? engineeringDept.id : null,
      jobId: jobMap["初階助理工程師"] || null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5, // Standard user limit
      dailyCreditResetDate: new Date(),
    });
    console.log("User 6 created with departmentId:", user6.departmentId, "jobId:", user6.jobId);

    // User 7 - Design
    const user7 = await User.create({
      employeeId: "EMP007",
      name: "吳雅婷",
      email: "yating.wu@example.com",
      departmentId: designDept ? designDept.id : null,
      jobId: jobMap["設計玩家"] || null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5,
      dailyCreditResetDate: new Date(),
    });
    console.log("User 7 created with departmentId:", user7.departmentId, "jobId:", user7.jobId);

    // User 8 - Engineering
    const user8 = await User.create({
      employeeId: "EMP008",
      name: "劉俊宏",
      email: "junhong.liu@example.com",
      departmentId: engineeringDept ? engineeringDept.id : null,
      jobId: jobMap["新手村"] || null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5,
      dailyCreditResetDate: new Date(),
    });
    console.log("User 8 created with departmentId:", user8.departmentId, "jobId:", user8.jobId);

    // User 9 - Marketing
    const user9 = await User.create({
      employeeId: "EMP009",
      name: "鄭美珠",
      email: "meizhu.zheng@example.com",
      departmentId: marketingDept ? marketingDept.id : null,
      jobId: jobMap["行銷初心者"] || null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5,
      dailyCreditResetDate: new Date(),
    });
    console.log("User 9 created with departmentId:", user9.departmentId, "jobId:", user9.jobId);

    // User 10 - Finance
    const user10 = await User.create({
      employeeId: "EMP010",
      name: "謝志豪",
      email: "zhihao.xie@example.com",
      departmentId: financeDept ? financeDept.id : null,
      jobId: jobMap["財務初心者"] || null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5,
      dailyCreditResetDate: new Date(),
    });
    console.log("User 10 created with departmentId:", user10.departmentId, "jobId:", user10.jobId);

    // Collect all users
    users = [
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
      user10,
    ];

    console.log(`Created ${users.length} users`);

    // Create progressive user skill progress
    const existingUserSkillCount = await UserSkill.count();
    
    if (existingUserSkillCount === 0 || forceDrop) {
      console.log("Creating progressive user skill progress...");
      
      // Get all job skill mappings to create progression
      const allJobSkills = await JobSkill.findAll({
        include: [
          {
            model: Job,
            attributes: ['id', 'name']
          },
          {
            model: Skill,
            attributes: ['id', 'name', 'category']
          }
        ]
      });

      // Group skills by job
      const skillsByJob = {};
      allJobSkills.forEach(jobSkill => {
        const jobName = jobSkill.Job.name;
        if (!skillsByJob[jobName]) {
          skillsByJob[jobName] = [];
        }
        skillsByJob[jobName].push(jobSkill.Skill);
      });

      const userSkillProgress = [];
      
      // Define job progression orders for each department
      const jobProgressions = {
        '工程部': ['新手村', '初階助理工程師', '進階助理工程師', '正式工程師', '資深工程師'],
        '物流部': ['助理物流', '正式物流', '物流主管'],
        '行銷部': ['行銷初心者', '行銷玩家', '行銷大師'],
        '人資部': ['人資初心者', '人資玩家', '人資大師'],
        '財務部': ['財務初心者', '財務玩家', '財務大師'],
        '客服部': ['客服初心者', '客服玩家', '客服大師'],
        '設計部': ['設計初心者', '設計玩家', '設計大師']
      };

      // Add progress for ALL users based on their department and job
      for (const user of users) {
        // Get user's department name
        const userDept = await Department.findByPk(user.departmentId);
        const deptName = userDept?.name;
        
        if (!deptName || !jobProgressions[deptName]) {
          console.log(`Warning: No progression defined for department ${deptName}`);
          continue;
        }
        const userJobName = Object.keys(jobMap).find(key => jobMap[key] === user.jobId);
        const deptProgression = jobProgressions[deptName];
        const userJobIndex = deptProgression.findIndex(job => userJobName?.includes(job) || userJobName === job);
        
        console.log(`Creating skills for ${user.name} (${deptName} - ${userJobName}) - Job index: ${userJobIndex}`);

        // Skip if job not found in progression
        if (userJobIndex === -1) {
          console.log(`Warning: Job ${userJobName} not found in ${deptName} progression`);
          continue;
        }

        // Track unique skills for this user to avoid duplicates
        const userSkillsAdded = new Set();

        // Create progressive skill completion based on job level
        for (let i = 0; i <= userJobIndex; i++) {
          const currentJobLevel = deptProgression[i];
          const skillsForLevel = skillsByJob[currentJobLevel] || [];

          for (const skill of skillsForLevel) {
            // Skip if we've already added this skill for this user
            if (userSkillsAdded.has(skill.id)) {
              continue;
            }
            userSkillsAdded.add(skill.id);

            let status, startedAt, completedAt, certifiedAt, score, attempts;
            
            // All previous job levels should be completed/certified
            if (i < userJobIndex) {
              status = 'certified';
              const daysAgo = 60 - (i * 15); // Older completions for earlier levels
              startedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
              completedAt = new Date(Date.now() - (daysAgo - 5) * 24 * 60 * 60 * 1000);
              certifiedAt = new Date(Date.now() - (daysAgo - 7) * 24 * 60 * 60 * 1000);
              score = Math.floor(Math.random() * 15) + 85; // High scores for certified skills
              attempts = 1;
            } 
            // Current job level skills
            else if (i === userJobIndex) {
              // Mix of completed and in-progress for current level
              const random = Math.random();
              if (random < 0.7) { // 70% completed
                status = 'completed';
                startedAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
                completedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
                score = Math.floor(Math.random() * 20) + 80;
                attempts = Math.floor(Math.random() * 2) + 1;
              } else if (random < 0.9) { // 20% in progress
                status = 'in_progress';
                startedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
                attempts = 0;
              } else { // 10% not started
                status = 'not_started';
                attempts = 0;
              }
            }

            userSkillProgress.push({
              userId: user.id,
              skillId: skill.id,
              status,
              startedAt,
              completedAt,
              certifiedAt,
              score,
              attempts,
              certifiedBy: status === 'certified' ? user1.id : null // Admin certifies
            });
          }
        }
      }

      if (userSkillProgress.length > 0) {
        await UserSkill.bulkCreate(userSkillProgress);
        console.log(`Created ${userSkillProgress.length} progressive user skill records`);
        
        // Log summary for each user
        const summaryByUser = {};
        userSkillProgress.forEach(up => {
          const user = users.find(u => u.id === up.userId);
          const userName = user?.name || 'Unknown';
          if (!summaryByUser[userName]) {
            summaryByUser[userName] = { certified: 0, completed: 0, in_progress: 0, not_started: 0 };
          }
          summaryByUser[userName][up.status]++;
        });
        
        console.log('Skill progress summary:');
        Object.entries(summaryByUser).forEach(([name, stats]) => {
          console.log(`  ${name}: ${stats.certified} certified, ${stats.completed} completed, ${stats.in_progress} in progress, ${stats.not_started} not started`);
        });
      }
    } else {
      console.log(`Found ${existingUserSkillCount} existing user skill progress records, skipping creation`);
    }

    // Seed default configurations
    const existingConfigCount = await Config.count();
    if (existingConfigCount === 0 || forceDrop) {
      console.log("Creating default system configurations...");
      
      const defaultConfigs = [
        {
          key: 'system_name',
          value: '山恩互動表彰系統',
          type: 'string',
          description: 'System display name shown throughout the application',
          category: 'system',
          isEditable: true
        },
        {
          key: 'default_daily_credit_limit',
          value: '5',
          type: 'number',
          description: 'Default daily credit limit for new users',
          category: 'credits',
          isEditable: true
        },
        {
          key: 'use_mock_api',
          value: 'false',
          type: 'boolean',
          description: 'Whether to use mock API responses for development/testing',
          category: 'development',
          isEditable: true
        },
        {
          key: 'maintenance_mode',
          value: 'false',
          type: 'boolean',
          description: 'Enable maintenance mode to temporarily disable user access',
          category: 'system',
          isEditable: true
        }
      ];

      for (const configData of defaultConfigs) {
        await Config.create(configData);
      }

      console.log(`Created ${defaultConfigs.length} default configurations`);
    } else {
      console.log(`Found ${existingConfigCount} existing configurations, skipping default config creation`);
    }

    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the seed function
seed();
