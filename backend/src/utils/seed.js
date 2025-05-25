const dotenv = require("dotenv");
dotenv.config();
const { sequelize, Department, User, Job, Skill, JobSkill, UserSkill } = require("../models");
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
      const engineeringJobs = ["新手村", "助理工程師", "正式工程師", "資深工程師"];
      
      for (const jobName of engineeringJobs) {
        const job = await Job.create({ name: jobName });
        jobs.push(job);
        jobMap[jobName] = job.id;
        console.log(`Created job: ${jobName}, ID: ${job.id}`);
      }

      // Create jobs for other departments with generic variants
      const otherDeptJobSuffixes = ["初心者", "玩家", "大師"];
      
      for (const dept of departments) {
        const deptNameBase = dept.name.replace("部", "");
        
        // Skip engineering department as we already created specific jobs
        if (deptNameBase === "工程") continue;
        
        for (const suffix of otherDeptJobSuffixes) {
          const jobName = `${deptNameBase}${suffix}`;
          const job = await Job.create({ name: jobName });
          jobs.push(job);
          jobMap[jobName] = job.id;
          console.log(`Created job: ${jobName}, ID: ${job.id}`);
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
      // Skills data based on the CSV
      const skillsData = [
        { name: "公司介紹與文化", category: "山恩DNA", isRequired: true, learningMethod: "實體", assessmentMethod: "考卷考核" },
        { name: "基本工作流程", category: "山恩DNA", isRequired: true, learningMethod: "實體", assessmentMethod: "考卷考核" },
        { name: "基本產品知識", category: "產品知識", isRequired: true, learningMethod: "實體", assessmentMethod: "考卷考核" },
        { name: "石材的特性", category: "產品知識", isRequired: true, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "機具認識", category: "工具使用", isRequired: true, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "加工方法", category: "安裝知識", isRequired: true, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "個人防護裝備的使用", category: "安全操作", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "基本安全操作規範", category: "安全操作", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "安裝前保護措施", category: "安裝技術", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "石材表面的檢查和清潔", category: "安裝技術", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "安裝後檢查和驗收", category: "安裝技術", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "石材存放與保護", category: "安全操作", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "石材的檢查與搬運技巧", category: "安全操作", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "機具使用", category: "工具使用", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "圖面解讀", category: "安裝技術", isRequired: true, learningMethod: "實體", assessmentMethod: "考卷考核" },
        { name: "工單操作教學", category: "工單操作教學", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "砂輪機", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "電鑽", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "跳鋸機", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "雕刻機", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "磨邊機", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "大電鋸", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "矽利康技巧", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "檯面設定（水平＆垂直）", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "接縫銜接（切割＆研磨修整）", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "側落 45 度接（背切修整）", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "石材的檢查與搬運技巧（實體）", category: "安全操作", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "案場作業流程", category: "現場作業", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "與其他工種的協作", category: "現場作業", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "一字型工程", category: "一字型工程", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "中島+雙側落工程", category: "中島+雙側落工程", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "接縫膠調色準確度", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "基礎水電知識", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "接縫平接（切割＆研磨修整）", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "開插座孔", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "鑽龍頭孔", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "裝修包覆", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "複雜安裝項目", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "石材修復與保養", category: "品質控制", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "管理工具與管理思維", category: "領導力與溝通", isRequired: false, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "有效溝通與問題解決", category: "領導力與溝通", isRequired: false, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "平接切邊", category: "平接切邊", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "水磨（包括熱彎安裝）", category: "水磨（包括熱彎安裝）", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "L型工程", category: "L型工程", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "ㄇ字型工程", category: "ㄇ字型工程", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "側落", category: "側落", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "高背", category: "高背", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "牆面工程", category: "牆面工程", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "維修美容工程", category: "維修美容工程", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "地板工程", category: "地板工程", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "木作全包覆工程", category: "木作全包覆工程", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" }
      ];

      skills = await Skill.bulkCreate(skillsData);
      console.log(`Created ${skills.length} skills`);
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
      
      // Map CSV data to job titles in our system
      const jobSkillMappings = [
        // 新手村 skills
        { jobName: "新手村", skills: [
          "公司介紹與文化", "基本工作流程", "基本產品知識", "石材的特性", "機具認識", "加工方法",
          "個人防護裝備的使用", "基本安全操作規範", "安裝前保護措施", "石材表面的檢查和清潔",
          "安裝後檢查和驗收", "石材存放與保護", "石材的檢查與搬運技巧", "機具使用", "圖面解讀"
        ]},
        // 助理工程師 skills
        { jobName: "助理工程師", skills: [
          "工單操作教學", "砂輪機", "電鑽", "跳鋸機", "雕刻機", "磨邊機", "大電鋸",
          "矽利康技巧", "檯面設定（水平＆垂直）", "接縫銜接（切割＆研磨修整）", "側落 45 度接（背切修整）",
          "石材的檢查與搬運技巧（實體）", "案場作業流程", "與其他工種的協作", "一字型工程", "中島+雙側落工程"
        ]},
        // 正式工程師 skills
        { jobName: "正式工程師", skills: [
          "接縫膠調色準確度", "基礎水電知識", "接縫平接（切割＆研磨修整）", "開插座孔", "鑽龍頭孔",
          "裝修包覆", "複雜安裝項目", "石材修復與保養", "管理工具與管理思維", "有效溝通與問題解決",
          "平接切邊", "水磨（包括熱彎安裝）", "L型工程", "ㄇ字型工程", "側落", "高背", "牆面工程", "維修美容工程"
        ]},
        // 資深工程師 skills
        { jobName: "資深工程師", skills: [
          "地板工程", "木作全包覆工程"
        ]}
      ];

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
      jobId: jobMap["助理工程師"] || null,
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

    // Create sample user skill progress
    const existingUserSkillCount = await UserSkill.count();
    
    if (existingUserSkillCount === 0 || forceDrop) {
      console.log("Creating sample user skill progress...");
      
      // Get some basic skills for demonstration
      const basicSkills = await Skill.findAll({
        where: {
          category: '山恩DNA'
        },
        limit: 3
      });

      const toolSkills = await Skill.findAll({
        where: {
          category: '工具使用'
        },
        limit: 2
      });

      const userSkillProgress = [];

      // Add progress for engineering users
      const engineeringUsers = users.filter(user => 
        user.departmentId === engineeringDept?.id
      );

      for (const user of engineeringUsers) {
        // Basic skills - completed for all engineering users
        for (const skill of basicSkills) {
          userSkillProgress.push({
            userId: user.id,
            skillId: skill.id,
            status: 'completed',
            startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            score: Math.floor(Math.random() * 20) + 80, // Score between 80-100
            attempts: 1
          });
        }

        // Tool skills - varying progress based on job level
        for (const skill of toolSkills) {
          let status = 'not_started';
          let startedAt = null;
          let completedAt = null;
          let score = null;
          let attempts = 0;

          // Advanced users have more progress
          if (user.jobId === jobMap["正式工程師"]) {
            status = 'certified';
            startedAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            completedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
            score = Math.floor(Math.random() * 15) + 85;
            attempts = 1;
          } else if (user.jobId === jobMap["助理工程師"]) {
            status = 'in_progress';
            startedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            attempts = 0;
          }
          // 新手村 users remain at not_started

          userSkillProgress.push({
            userId: user.id,
            skillId: skill.id,
            status,
            startedAt,
            completedAt,
            score,
            attempts
          });
        }
      }

      if (userSkillProgress.length > 0) {
        await UserSkill.bulkCreate(userSkillProgress);
        console.log(`Created ${userSkillProgress.length} user skill progress records`);
      }
    } else {
      console.log(`Found ${existingUserSkillCount} existing user skill progress records, skipping creation`);
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
