'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('skills', 'syllabus', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Exam outline/syllabus content for the skill (考試大綱)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('skills', 'syllabus');
  }
};