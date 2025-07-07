#!/usr/bin/env node

const { User, Department } = require('./src/models');

async function createAdmin() {
  try {
    console.log('🔄 Creating admin user...');

    // Create a default department if none exists
    let defaultDepartment = await Department.findOne({ where: { name: '系統管理部' } });
    
    if (!defaultDepartment) {
      console.log('📋 Creating default department for admin...');
      defaultDepartment = await Department.create({
        name: '系統管理部',
        description: '系統管理與維護部門',
        isActive: true
      });
      console.log('✅ Default department created');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { 
        role: 'admin',
        email: 'admin@company.com' 
      } 
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Employee ID: ${existingAdmin.employeeId}`);
      console.log('💡 You can use this account to access the admin dashboard');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: '系統管理員',
      email: 'admin@company.com',
      employeeId: 'ADMIN001',
      role: 'admin',
      departmentId: defaultDepartment.id,
      dailyCreditsLimit: 10,
      remainingDailyCredits: 10,
      creditsReceived: 0,
      creditsSent: 0
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Admin Account Details:');
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Employee ID: ${adminUser.employeeId}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Department: ${defaultDepartment.name}`);
    console.log('');
    console.log('🔑 To access admin dashboard:');
    console.log('   1. Go to your application');
    console.log('   2. Login with LINE (if LINE integration is set up)');
    console.log('   3. Bind your LINE account to Employee ID: ADMIN001');
    console.log('   4. Access /admin route');
    console.log('');
    console.log('💡 Alternative: You can create more admins via CSV import using this format:');
    console.log('   name,email,employeeId,departmentName,role');
    console.log('   管理員名稱,email@company.com,EMP001,系統管理部,admin');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdmin();