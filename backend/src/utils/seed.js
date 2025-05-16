const dotenv = require("dotenv");
dotenv.config();
const { sequelize, Department, User } = require("../models");
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
      role: "admin",
      remainingDailyCredits: 10,
      dailyCreditLimit: 10, // Admin gets more credits
      dailyCreditResetDate: new Date(),
    });
    console.log("User 1 created with departmentId:", user1.departmentId);

    // User 2 - Marketing
    const user2 = await User.create({
      employeeId: "EMP002",
      name: "李大華",
      email: "dahua.lee@example.com",
      departmentId: marketingDept ? marketingDept.id : null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5, // Standard user limit
      dailyCreditResetDate: new Date(),
    });
    console.log("User 2 created with departmentId:", user2.departmentId);

    // User 3 - HR
    const user3 = await User.create({
      employeeId: "EMP003",
      name: "張美玲",
      email: "meiling.zhang@example.com",
      departmentId: hrDept ? hrDept.id : null,
      role: "user",
      remainingDailyCredits: 7,
      dailyCreditLimit: 7, // HR gets slightly more
      dailyCreditResetDate: new Date(),
    });
    console.log("User 3 created with departmentId:", user3.departmentId);

    // User 4 - Finance
    const user4 = await User.create({
      employeeId: "EMP004",
      name: "陳志明",
      email: "zhiming.chen@example.com",
      departmentId: financeDept ? financeDept.id : null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5, // Standard user limit
      dailyCreditResetDate: new Date(),
    });
    console.log("User 4 created with departmentId:", user4.departmentId);

    // User 5 - Customer Service
    const user5 = await User.create({
      employeeId: "EMP005",
      name: "林小芳",
      email: "xiaofang.lin@example.com",
      departmentId: customerDept ? customerDept.id : null,
      role: "user",
      remainingDailyCredits: 8,
      dailyCreditLimit: 8, // Customer service gets more for client appreciations
      dailyCreditResetDate: new Date(),
    });
    console.log("User 5 created with departmentId:", user5.departmentId);

    // User 6 - Engineering
    const user6 = await User.create({
      employeeId: "EMP006",
      name: "黃建國",
      email: "jianguo.huang@example.com",
      departmentId: engineeringDept ? engineeringDept.id : null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditLimit: 5, // Standard user limit
      dailyCreditResetDate: new Date(),
    });
    console.log("User 6 created with departmentId:", user6.departmentId);

    // User 7 - Design
    const user7 = await User.create({
      employeeId: "EMP007",
      name: "吳雅婷",
      email: "yating.wu@example.com",
      departmentId: designDept ? designDept.id : null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditResetDate: new Date(),
    });
    console.log("User 7 created with departmentId:", user7.departmentId);

    // User 8 - Engineering
    const user8 = await User.create({
      employeeId: "EMP008",
      name: "劉俊宏",
      email: "junhong.liu@example.com",
      departmentId: engineeringDept ? engineeringDept.id : null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditResetDate: new Date(),
    });
    console.log("User 8 created with departmentId:", user8.departmentId);

    // User 9 - Marketing
    const user9 = await User.create({
      employeeId: "EMP009",
      name: "鄭美珠",
      email: "meizhu.zheng@example.com",
      departmentId: marketingDept ? marketingDept.id : null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditResetDate: new Date(),
    });
    console.log("User 9 created with departmentId:", user9.departmentId);

    // User 10 - Finance
    const user10 = await User.create({
      employeeId: "EMP010",
      name: "謝志豪",
      email: "zhihao.xie@example.com",
      departmentId: financeDept ? financeDept.id : null,
      role: "user",
      remainingDailyCredits: 5,
      dailyCreditResetDate: new Date(),
    });
    console.log("User 10 created with departmentId:", user10.departmentId);

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
