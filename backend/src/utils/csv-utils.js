const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// CSV parsing utility functions
class CSVUtils {
  
  // Parse CSV file from buffer
  static async parseCSVFromBuffer(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      
      // Convert buffer to string and split into lines
      const csvString = buffer.toString('utf8');
      const lines = csvString.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        resolve([]);
        return;
      }
      
      // Parse header row
      const headerLine = lines[0];
      const headers = headerLine.split(',').map(h => h.trim());
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim()); // Add the last value
        
        // Create object with headers as keys
        const record = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        
        results.push(record);
      }
      
      resolve(results);
    });
  }

  // Validate CSV headers
  static validateHeaders(data, requiredHeaders) {
    if (!data || data.length === 0) {
      throw new Error('CSV file is empty');
    }

    const firstRow = data[0];
    const actualHeaders = Object.keys(firstRow);
    const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    return true;
  }

  // Validate user CSV data
  static validateUserData(data) {
    const requiredHeaders = ['name', 'email', 'employeeId', 'departmentName', 'role'];
    this.validateHeaders(data, requiredHeaders);
    
    const errors = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because CSV rows start at 2 (1 is header)
      
      // Validate required fields
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${rowNum}: Name is required`);
      }
      
      if (!row.email || row.email.trim() === '') {
        errors.push(`Row ${rowNum}: Email is required`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push(`Row ${rowNum}: Invalid email format`);
      }
      
      if (!row.employeeId || row.employeeId.trim() === '') {
        errors.push(`Row ${rowNum}: Employee ID is required`);
      }
      
      if (!row.departmentName || row.departmentName.trim() === '') {
        errors.push(`Row ${rowNum}: Department name is required`);
      }
      
      if (!row.role || row.role.trim() === '') {
        errors.push(`Row ${rowNum}: Role is required`);
      }
      
      // jobName is optional but if provided, it should not be empty
      if (row.jobName && row.jobName.trim() === '') {
        errors.push(`Row ${rowNum}: Job name cannot be empty if provided`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Validation errors:\n${errors.join('\n')}`);
    }
    
    return true;
  }

  // Validate skill CSV data
  static validateSkillData(data) {
    const requiredHeaders = ['name', 'category', 'learningMethod', 'assessmentMethod'];
    this.validateHeaders(data, requiredHeaders);
    
    const errors = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 2;
      
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${rowNum}: Skill name is required`);
      }
      
      if (!row.category || row.category.trim() === '') {
        errors.push(`Row ${rowNum}: Category is required`);
      }
      
      if (!row.learningMethod || row.learningMethod.trim() === '') {
        errors.push(`Row ${rowNum}: Learning method is required`);
      }
      
      if (!row.assessmentMethod || row.assessmentMethod.trim() === '') {
        errors.push(`Row ${rowNum}: Assessment method is required`);
      }
      
      // Validate isRequired field if present (flexible boolean validation)
      if (row.isRequired && !['true', 'false', '1', '0', 'yes', 'no'].includes(row.isRequired.toLowerCase())) {
        errors.push(`Row ${rowNum}: isRequired must be true/false, 1/0, or yes/no`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Validation errors:\n${errors.join('\n')}`);
    }
    
    return true;
  }

  // Validate department CSV data
  static validateDepartmentData(data) {
    const requiredHeaders = ['name'];
    this.validateHeaders(data, requiredHeaders);
    
    const errors = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 2;
      
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${rowNum}: Department name is required`);
      }
      
      // Validate isActive field if present
      if (row.isActive && !['true', 'false', '1', '0', 'yes', 'no'].includes(row.isActive.toLowerCase())) {
        errors.push(`Row ${rowNum}: isActive must be true/false, 1/0, or yes/no`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Validation errors:\n${errors.join('\n')}`);
    }
    
    return true;
  }

  // Validate job CSV data
  static validateJobData(data) {
    const requiredHeaders = ['name', 'departmentName'];
    this.validateHeaders(data, requiredHeaders);
    
    const errors = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 2;
      
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${rowNum}: Job name is required`);
      }
      
      if (!row.departmentName || row.departmentName.trim() === '') {
        errors.push(`Row ${rowNum}: Department name is required`);
      }
      
      // Validate level if present (should be a positive integer)
      if (row.level && (isNaN(parseInt(row.level)) || parseInt(row.level) < 1)) {
        errors.push(`Row ${rowNum}: Level must be a positive integer`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Validation errors:\n${errors.join('\n')}`);
    }
    
    return true;
  }

  // Convert boolean-like strings to actual booleans
  static parseBoolean(value) {
    if (!value) return false;
    const str = value.toString().toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(str);
  }

  // Clean and normalize string fields
  static cleanString(value) {
    return value ? value.toString().trim() : '';
  }

  // Generate example CSV content
  static generateExampleCSV(type) {
    const examples = {
      users: [
        'name,email,employeeId,departmentName,jobName,role',
        '範例員工,example@company.com,EMP001,範例部門,範例職位,user',
        '範例管理員,admin@company.com,EMP002,管理部門,管理職位,admin'
      ].join('\n'),
      
      skills: [
        'name,category,learningMethod,assessmentMethod,isRequired,syllabus',
        '範例技能一,技能類別A,學習方法A,評估方法A,true,技能描述與學習大綱',
        '範例技能二,技能類別B,學習方法B,評估方法B,false,技能描述與評估標準'
      ].join('\n'),
      
      departments: [
        'name,description,isActive',
        '範例部門A,部門功能描述,true',
        '範例部門B,部門功能描述,false'
      ].join('\n'),
      
      jobs: [
        'name,departmentName,level,nextJobName',
        '初級職位,範例部門A,1,中級職位',
        '中級職位,範例部門A,2,高級職位',
        '高級職位,範例部門A,3,'
      ].join('\n')
    };
    
    return examples[type] || '';
  }
}

module.exports = CSVUtils;