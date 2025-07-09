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
      
      // Convert buffer to string and remove BOM if present
      let csvString = buffer.toString('utf8');
      if (csvString.charCodeAt(0) === 0xFEFF) {
        csvString = csvString.slice(1);
      }
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

  // Generate example CSV content from actual sample files
  static generateExampleCSV(type) {
    const fs = require('fs');
    const path = require('path');
    
    // Map type to actual sample file names
    const fileMap = {
      users: 'users-sample.csv',
      skills: 'skills-sample.csv', 
      departments: 'departments-sample.csv',
      jobs: 'jobs-sample.csv'
    };
    
    const fileName = fileMap[type];
    if (!fileName) {
      return '';
    }
    
    try {
      // Path to sample data directory
      const sampleDataPath = path.join(__dirname, '../../sample-data', fileName);
      
      // Check if file exists
      if (!fs.existsSync(sampleDataPath)) {
        console.warn(`Sample file not found: ${sampleDataPath}`);
        return '';
      }
      
      // Read and return the file content
      const content = fs.readFileSync(sampleDataPath, 'utf8');
      return content.trim();
    } catch (error) {
      console.error(`Error reading sample file for ${type}:`, error);
      return '';
    }
  }
}

module.exports = CSVUtils;