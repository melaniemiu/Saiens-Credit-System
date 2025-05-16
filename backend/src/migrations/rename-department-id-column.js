'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check if the column exists
    const tableInfo = await queryInterface.describeTable('users');
    
    if (tableInfo.DepartmentId && !tableInfo.departmentId) {
      // Rename column from DepartmentId to departmentId
      await queryInterface.renameColumn('users', 'DepartmentId', 'departmentId');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');
    
    if (tableInfo.departmentId && !tableInfo.DepartmentId) {
      // Rename column back from departmentId to DepartmentId
      await queryInterface.renameColumn('users', 'departmentId', 'DepartmentId');
    }
  }
};