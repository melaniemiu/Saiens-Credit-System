#!/usr/bin/env node

const { User, Credit, Department, Job, Skill, UserSkill, JobSkill } = require('./src/models');

async function wipeData() {
  try {
    const args = process.argv.slice(2);
    const wipeType = args[0] || 'all';

    console.log('🔄 Starting data wipe...');

    switch (wipeType) {
      case 'users':
        await User.destroy({ where: {}, force: true });
        console.log('✅ All users wiped');
        break;

      case 'credits':
        await Credit.destroy({ where: {}, force: true });
        console.log('✅ All credits wiped');
        break;

      case 'skills':
        await UserSkill.destroy({ where: {}, force: true });
        await JobSkill.destroy({ where: {}, force: true });
        await Skill.destroy({ where: {}, force: true });
        console.log('✅ All skills wiped');
        break;

      case 'jobs':
        await UserSkill.destroy({ where: {}, force: true });
        await JobSkill.destroy({ where: {}, force: true });
        await Job.destroy({ where: {}, force: true });
        console.log('✅ All jobs wiped');
        break;

      case 'departments':
        await User.update({ departmentId: null }, { where: {} });
        await Job.update({ departmentId: null }, { where: {} });
        await Department.destroy({ where: {}, force: true });
        console.log('✅ All departments wiped');
        break;

      case 'progress':
        await UserSkill.destroy({ where: {}, force: true });
        console.log('✅ All skill progress wiped');
        break;

      case 'all':
      default:
        // Wipe in order of dependencies
        console.log('🗑️  Wiping all data...');
        await Credit.destroy({ where: {}, force: true });
        console.log('   - Credits wiped');
        
        await UserSkill.destroy({ where: {}, force: true });
        console.log('   - User skills wiped');
        
        await JobSkill.destroy({ where: {}, force: true });
        console.log('   - Job skills wiped');
        
        await User.destroy({ where: {}, force: true });
        console.log('   - Users wiped');
        
        await Skill.destroy({ where: {}, force: true });
        console.log('   - Skills wiped');
        
        await Job.destroy({ where: {}, force: true });
        console.log('   - Jobs wiped');
        
        await Department.destroy({ where: {}, force: true });
        console.log('   - Departments wiped');
        
        console.log('✅ All data wiped successfully!');
        break;
    }

    console.log('💡 You can now import fresh data using CSV import');
    process.exit(0);
  } catch (error) {
    console.error('❌ Data wipe failed:', error);
    process.exit(1);
  }
}

console.log('Available wipe options:');
console.log('  npm run wipe-data          - Wipe all data');
console.log('  node wipe-data.js users    - Wipe only users');
console.log('  node wipe-data.js credits  - Wipe only credits');
console.log('  node wipe-data.js skills   - Wipe only skills');
console.log('  node wipe-data.js jobs     - Wipe only jobs');
console.log('  node wipe-data.js departments - Wipe only departments');
console.log('  node wipe-data.js progress - Wipe only skill progress');
console.log('');

wipeData();