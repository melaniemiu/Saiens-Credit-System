const dotenv = require("dotenv");
dotenv.config();
const { sequelize, Department, User, Job, Skill, JobSkill, UserSkill, SkillDepartment } = require("../models");
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
      // Skills data based exactly on the CSV
      const skillsData = [
        // 新手村 skills
        { name: "山恩DNA 公司介紹與文化", category: "山恩DNA", isRequired: true, learningMethod: "實體", assessmentMethod: "考卷考核" },
        { name: "山恩DNA 基本工作流程", category: "山恩DNA", isRequired: true, learningMethod: "實體", assessmentMethod: "考卷考核" },
        { name: "產品知識 基本產品知識", category: "產品知識", isRequired: true, learningMethod: "實體", assessmentMethod: "考卷考核" },
        { name: "產品知識 石材的特性", category: "產品知識", isRequired: true, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "工具使用 機具認識", category: "工具使用", isRequired: true, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "安裝知識 加工方法", category: "安裝知識", isRequired: true, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "安全操作 個人防護裝備的使用", category: "安全操作", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "安全操作 基本安全操作規範", category: "安全操作", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "安裝技術 安裝前保護措施", category: "安裝技術", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "安裝技術 石材表面的檢查和清潔", category: "安裝技術", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "安裝技術 安裝後檢查和驗收", category: "安裝技術", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "安全操作 石材存放與保護", category: "安全操作", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "安全操作 石材的檢查與搬運技巧", category: "安全操作", isRequired: false, learningMethod: "線上", assessmentMethod: "實作考核" },
        { name: "工具使用 機具使用", category: "工具使用", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 圖面解讀", category: "安裝技術", isRequired: true, learningMethod: "實體", assessmentMethod: "考卷考核" },
        
        // 助理工程師 skills
        { name: "工單操作教學", category: "工單操作教學", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "工具使用 砂輪機", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "工具使用 電鑽", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "工具使用 跳鋸機", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "工具使用 雕刻機", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "工具使用 磨邊機", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "工具使用 大電鋸", category: "工具使用", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 矽利康技巧", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 檯面設定（水平＆垂直）", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 接縫銜接（切割＆研磨修整）", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 側落 45 度接（背切修整）", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安全操作 石材的檢查與搬運技巧", category: "安全操作", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "現場作業 案場作業流程", category: "現場作業", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "現場作業 與其他工種的協作", category: "現場作業", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "一字型工程", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "中島+雙側落工程", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        
        // 正式工程師 skills
        { name: "安裝技術 接縫膠調色準確度", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 基礎水電知識", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 接縫平接（切割＆研磨修整）", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 開插座孔", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 鑽龍頭孔", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 裝修包覆", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "安裝技術 複雜安裝項目", category: "安裝技術", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "品質控制 石材修復與保養", category: "品質控制", isRequired: false, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "領導力與溝通 管理工具與管理思維", category: "領導力與溝通", isRequired: false, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "領導力與溝通 有效溝通與問題解決", category: "領導力與溝通", isRequired: false, learningMethod: "線上", assessmentMethod: "考卷考核" },
        { name: "平接切邊", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "水磨（包括熱彎安裝）", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "L型工程", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "ㄇ字型工程", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "側落", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "高背", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "牆面工程", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "維修美容工程", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        
        // 資深工程師 skills
        { name: "地板工程", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" },
        { name: "木作全包覆工程", category: "工程項目", isRequired: true, learningMethod: "實體", assessmentMethod: "實作考核" }
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
      
      // Map CSV data to job titles in our system - exactly as in CSV
      const jobSkillMappings = [
        // 新手村 skills - exactly from CSV
        { jobName: "新手村", skills: [
          "山恩DNA 公司介紹與文化", "山恩DNA 基本工作流程", "產品知識 基本產品知識", "產品知識 石材的特性", 
          "工具使用 機具認識", "安裝知識 加工方法", "安全操作 個人防護裝備的使用", "安全操作 基本安全操作規範",
          "安裝技術 安裝前保護措施", "安裝技術 石材表面的檢查和清潔", "安裝技術 安裝後檢查和驗收", 
          "安全操作 石材存放與保護", "安全操作 石材的檢查與搬運技巧", "工具使用 機具使用", "安裝技術 圖面解讀"
        ]},
        // 助理工程師 skills - exactly from CSV
        { jobName: "助理工程師", skills: [
          "工單操作教學", "工具使用 砂輪機", "工具使用 電鑽", "工具使用 跳鋸機", "工具使用 雕刻機", 
          "工具使用 磨邊機", "工具使用 大電鋸", "安裝技術 矽利康技巧", "安裝技術 檯面設定（水平＆垂直）",
          "安裝技術 接縫銜接（切割＆研磨修整）", "安裝技術 側落 45 度接（背切修整）", "安全操作 石材的檢查與搬運技巧",
          "現場作業 案場作業流程", "現場作業 與其他工種的協作", "一字型工程", "中島+雙側落工程"
        ]},
        // 正式工程師 skills - exactly from CSV
        { jobName: "正式工程師", skills: [
          "安裝技術 接縫膠調色準確度", "安裝技術 基礎水電知識", "安裝技術 接縫平接（切割＆研磨修整）", 
          "安裝技術 開插座孔", "安裝技術 鑽龍頭孔", "安裝技術 裝修包覆", "安裝技術 複雜安裝項目",
          "品質控制 石材修復與保養", "領導力與溝通 管理工具與管理思維", "領導力與溝通 有效溝通與問題解決",
          "平接切邊", "水磨（包括熱彎安裝）", "L型工程", "ㄇ字型工程", "側落", "高背", "牆面工程", "維修美容工程"
        ]},
        // 資深工程師 skills - exactly from CSV
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

    // Create skill-department associations
    const existingSkillDeptCount = await SkillDepartment.count();
    
    if (existingSkillDeptCount === 0 || forceDrop) {
      console.log("Creating skill-department associations...");
      
      // Most skills are engineering-specific, but some are cross-departmental
      const skillDepartmentMappings = [
        // Engineering department gets all technical skills
        {
          departmentName: "工程部",
          skillCategories: [
            "山恩DNA", "產品知識", "工具使用", "安裝知識", "安全操作", 
            "安裝技術", "工單操作教學", "現場作業", "工程項目", "品質控制"
          ]
        },
        // HR department gets leadership and communication skills
        {
          departmentName: "人資部", 
          skillCategories: ["領導力與溝通", "山恩DNA"]
        },
        // All departments get basic DNA skills
        {
          departmentName: "行銷部",
          skillCategories: ["山恩DNA", "領導力與溝通"]
        },
        {
          departmentName: "財務部",
          skillCategories: ["山恩DNA"]
        },
        {
          departmentName: "客服部",
          skillCategories: ["山恩DNA", "領導力與溝通"]
        },
        {
          departmentName: "設計部",
          skillCategories: ["山恩DNA", "產品知識"]
        }
      ];

      const skillDeptAssociations = [];
      
      for (const mapping of skillDepartmentMappings) {
        // Find department
        const department = departments.find(d => d.name === mapping.departmentName);
        if (!department) {
          console.log(`Warning: Department '${mapping.departmentName}' not found`);
          continue;
        }

        // Find skills by category
        for (const category of mapping.skillCategories) {
          const categorySkills = skills.filter(skill => skill.category === category);
          
          for (const skill of categorySkills) {
            // Check if association already exists
            const existingAssociation = skillDeptAssociations.find(
              assoc => assoc.skillId === skill.id && assoc.departmentId === department.id
            );
            
            if (!existingAssociation) {
              skillDeptAssociations.push({
                skillId: skill.id,
                departmentId: department.id
              });
            }
          }
        }
      }

      if (skillDeptAssociations.length > 0) {
        await SkillDepartment.bulkCreate(skillDeptAssociations);
        console.log(`Created ${skillDeptAssociations.length} skill-department associations`);
        
        // Log summary by department
        const summaryByDept = {};
        skillDeptAssociations.forEach(assoc => {
          const dept = departments.find(d => d.id === assoc.departmentId);
          const deptName = dept?.name || 'Unknown';
          summaryByDept[deptName] = (summaryByDept[deptName] || 0) + 1;
        });
        
        console.log('Skill-department associations summary:');
        Object.entries(summaryByDept).forEach(([deptName, count]) => {
          console.log(`  ${deptName}: ${count} skills`);
        });
      }
    } else {
      console.log(`Found ${existingSkillDeptCount} existing skill-department associations, skipping creation`);
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
      
      // Define job progression order
      const jobProgression = ['新手村', '助理工程師', '正式工程師', '資深工程師'];

      // Add progress for engineering users
      const engineeringUsers = users.filter(user => 
        user.departmentId === engineeringDept?.id
      );

      for (const user of engineeringUsers) {
        const userJobName = Object.keys(jobMap).find(key => jobMap[key] === user.jobId);
        const userJobIndex = jobProgression.findIndex(job => userJobName?.includes(job) || userJobName === job);
        
        console.log(`Creating skills for ${user.name} (${userJobName}) - Job index: ${userJobIndex}`);

        // Track unique skills for this user to avoid duplicates
        const userSkillsAdded = new Set();

        // Create progressive skill completion based on job level
        for (let i = 0; i <= userJobIndex; i++) {
          const currentJobLevel = jobProgression[i];
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
          const user = engineeringUsers.find(u => u.id === up.userId);
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
