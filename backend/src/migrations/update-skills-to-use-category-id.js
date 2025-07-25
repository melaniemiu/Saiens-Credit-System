module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if categoryId column already exists
    const tableDesc = await queryInterface.describeTable('skills');
    
    if (!tableDesc.categoryId) {
      // Add the new categoryId column
      await queryInterface.addColumn('skills', 'categoryId', {
        type: Sequelize.UUID,
        allowNull: true, // Temporarily allow null during migration
        references: {
          model: 'skill_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Foreign key reference to skill_categories table'
      });

      // Add index for the new foreign key
      await queryInterface.addIndex('skills', ['categoryId'], {
        name: 'skills_category_id_idx'
      });
    }

    // Migrate existing category strings to categoryId references
    const skills = await queryInterface.sequelize.query(
      'SELECT id, category FROM skills WHERE category IS NOT NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const skill of skills) {
      // Find the corresponding category ID
      const categoryResults = await queryInterface.sequelize.query(
        'SELECT id FROM skill_categories WHERE name = :categoryName LIMIT 1',
        { 
          replacements: { categoryName: skill.category },
          type: Sequelize.QueryTypes.SELECT 
        }
      );

      if (categoryResults && categoryResults.length > 0) {
        // Update the skill with the category ID
        await queryInterface.sequelize.query(
          'UPDATE skills SET "categoryId" = :categoryId WHERE id = :skillId',
          {
            replacements: { 
              categoryId: categoryResults[0].id,
              skillId: skill.id 
            }
          }
        );
      } else {
        // If category doesn't exist, create it
        console.log(`Creating new category: ${skill.category}`);
        const { v4: uuidv4 } = require('uuid');
        const newId = uuidv4();
        
        await queryInterface.sequelize.query(
          `INSERT INTO skill_categories (id, name, description, "isActive", "sortOrder", "createdAt", "updatedAt") 
           VALUES (:categoryId, :categoryName, 'Migrated category', true, 999, NOW(), NOW())`,
          {
            replacements: { categoryId: newId, categoryName: skill.category }
          }
        );
        
        const newCategoryId = [{ id: newId }];

        if (newCategoryId && newCategoryId.length > 0) {
          await queryInterface.sequelize.query(
            'UPDATE skills SET "categoryId" = :categoryId WHERE id = :skillId',
            {
              replacements: { 
                categoryId: newCategoryId[0].id,
                skillId: skill.id 
              }
            }
          );
        }
      }
    }

    // Make categoryId required after migration
    await queryInterface.changeColumn('skills', 'categoryId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'skill_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Foreign key reference to skill_categories table'
    });

    // Check if old category column exists before removing
    const tableDescAfter = await queryInterface.describeTable('skills');
    if (tableDescAfter.category) {
      // Remove the old category column
      await queryInterface.removeColumn('skills', 'category');
    }

    // Try to remove the old index on category (ignore if it doesn't exist)
    try {
      await queryInterface.removeIndex('skills', 'skills_category_idx');
    } catch (error) {
      // Index might not exist, continue
      console.log('Index skills_category_idx does not exist or already removed');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the category column
    await queryInterface.addColumn('skills', 'category', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Category like: 山恩DNA, 產品知識, 工具使用, etc.'
    });

    // Migrate categoryId back to category strings
    const skills = await queryInterface.sequelize.query(
      `SELECT s.id, s."categoryId", sc.name as category_name 
       FROM skills s 
       LEFT JOIN skill_categories sc ON s."categoryId" = sc.id 
       WHERE s."categoryId" IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const skill of skills) {
      if (skill.category_name) {
        await queryInterface.sequelize.query(
          'UPDATE skills SET category = :categoryName WHERE id = :skillId',
          {
            replacements: { 
              categoryName: skill.category_name,
              skillId: skill.id 
            }
          }
        );
      }
    }

    // Make category required
    await queryInterface.changeColumn('skills', 'category', {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Category like: 山恩DNA, 產品知識, 工具使用, etc.'
    });

    // Add back the index
    await queryInterface.addIndex('skills', ['category'], {
      name: 'skills_category_idx'
    });

    // Remove the categoryId column and its index
    await queryInterface.removeIndex('skills', 'skills_category_id_idx');
    await queryInterface.removeColumn('skills', 'categoryId');
  }
};