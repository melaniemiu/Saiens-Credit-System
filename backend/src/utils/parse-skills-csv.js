const fs = require('fs');
const path = require('path');

/**
 * Parse the skills CSV file and return structured data
 */
function parseSkillsCsv() {
  const csvPath = path.join(__dirname, '../../../skillContent.csv');
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Skills CSV file not found at: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  // Skip the header line
  const dataLines = lines.slice(1).filter(line => line.trim() && !line.startsWith(','));
  
  const skills = [];
  const jobSkillMappings = {};
  
  for (const line of dataLines) {
    // Parse CSV line - handle quoted fields with commas
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim()); // Add the last field
    
    // Skip if not enough fields
    if (fields.length < 6) continue;
    
    const [jobName, skillItem, requiredOrOption, learningMethod, syllabus, assessmentMethod] = fields;
    
    // Skip empty rows
    if (!jobName || !skillItem) continue;
    
    // Determine category from skill name
    let category = 'General';
    if (skillItem.includes('山恩DNA')) {
      category = '山恩DNA';
    } else if (skillItem.includes('產品知識')) {
      category = '產品知識';
    } else if (skillItem.includes('工具使用')) {
      category = '工具使用';
    } else if (skillItem.includes('安裝知識')) {
      category = '安裝知識';
    } else if (skillItem.includes('安全操作')) {
      category = '安全操作';
    } else if (skillItem.includes('安裝技術')) {
      category = '安裝技術';
    } else if (skillItem.includes('問題診斷')) {
      category = '問題診斷';
    } else if (skillItem.includes('專案管理')) {
      category = '專案管理';
    } else if (skillItem.includes('領導力與溝通')) {
      category = '領導力與溝通';
    } else if (skillItem.includes('品質控制')) {
      category = '品質控制';
    } else if (skillItem.includes('現場作業')) {
      category = '現場作業';
    } else if (skillItem.includes('工程') || skillItem.includes('型工程') || skillItem.includes('側落') || skillItem.includes('高背') || skillItem.includes('牆面') || skillItem.includes('維修') || skillItem.includes('地板') || skillItem.includes('木作')) {
      category = '工程項目';
    } else if (skillItem.includes('工單操作')) {
      category = '工單操作';
    } else {
      // Guess category from skill patterns
      if (/基礎作業|設備操作|安全與基礎知識/.test(skillItem)) {
        category = '基礎作業';
      } else if (/進階作業|異常與風險處理/.test(skillItem)) {
        category = '進階作業';
      } else if (/管理與規劃|系統整合與創新|策略規劃與決策|組織發展與人才培育/.test(skillItem)) {
        category = '管理';
      }
    }
    
    // Create skill object
    const skill = {
      name: skillItem,
      category: category,
      learningMethod: learningMethod || '線上',
      assessmentMethod: assessmentMethod || '實作考核',
      syllabus: syllabus || null
    };
    
    // Check if skill already exists in array
    if (!skills.find(s => s.name === skill.name)) {
      skills.push(skill);
    }
    
    // Build job-skill mappings
    if (!jobSkillMappings[jobName]) {
      jobSkillMappings[jobName] = [];
    }
    
    if (!jobSkillMappings[jobName].includes(skillItem)) {
      jobSkillMappings[jobName].push(skillItem);
    }
  }
  
  return {
    skills,
    jobSkillMappings
  };
}

module.exports = { parseSkillsCsv };