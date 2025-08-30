import axios from 'axios';

const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

class GoogleSheetsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    this.sheetId = process.env.REACT_APP_GOOGLE_SHEETS_SHEET_ID;
  }

  // Get data from Google Sheets
  async getSheetData(range = 'A:Z') {
    try {
      const url = `${GOOGLE_SHEETS_API_BASE}/${this.sheetId}/values/${range}`;
      const response = await axios.get(url, {
        params: {
          key: this.apiKey
        }
      });

      return this.parseSheetData(response.data.values);
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      throw new Error('Failed to fetch data from Google Sheets');
    }
  }

  // Parse sheet data into structured format
  parseSheetData(values) {
    if (!values || values.length < 2) {
      return [];
    }

    const rawHeaders = values[0];
    const rows = values.slice(1);

    // Normalize a header: lower-case, remove non-alphanumerics
    const normalize = (str) => (str || '')
      .toString()
      .toLowerCase()
      .replace(/"/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    // Build a header map from normalized header → column index
    const normalizedHeaderToIndex = {};
    rawHeaders.forEach((h, i) => {
      normalizedHeaderToIndex[normalize(h)] = i;
    });

    // Helper to read a cell by a list of possible header aliases
    const readByAliases = (aliases, row) => {
      for (const alias of aliases) {
        const idx = normalizedHeaderToIndex[alias];
        if (idx !== undefined && row[idx] !== undefined) {
          return row[idx];
        }
      }
      return '';
    };

    // Canonical aliases for the provided header set
    const aliases = {
      lastName: [normalize('L.Name'), 'l name', 'last name', 'lname', 'last'],
      firstName: [normalize('F.Name'), 'f name', 'first name', 'fname', 'first'],
      rank: ['rank'],
      troopJob: ['troop job', 'job', 'position'],
      mainPhone: [normalize("Main Phone# (to contact Scout)"), 'main phone to contact scout', 'main phone', 'primary phone', 'phone'],
      scoutEmail: [normalize("Scout's E-Mail Address"), 'scout s e mail address', 'scout email', 'email'],
      fatherName: ['father'],
      fatherEmail: [normalize("Father's  E-Mail Address"), 'father s e mail address', 'father email'],
      fatherPhone: [normalize("Father's phone"), 'father phone'],
      motherName: ['mother'],
      motherEmail: [normalize("Mother's  E-Mail Address"), 'mother s e mail address', 'mother email'],
      motherPhone: [normalize("Mother's phone"), 'mother phone'],
      address: ['address'],
      dateToJoin: ['date to join', 'join date', 'date join'],
      dob: ['dob', 'date of birth', 'birthdate']
    };

    const parsed = rows
      .map((row) => {
        const lastName = readByAliases(aliases.lastName, row).trim();
        const firstName = readByAliases(aliases.firstName, row).trim();
        const rank = readByAliases(aliases.rank, row).trim();
        const troopJob = readByAliases(aliases.troopJob, row).trim();
        const mainPhone = readByAliases(aliases.mainPhone, row).trim();
        const scoutEmail = readByAliases(aliases.scoutEmail, row).trim();
        const father = readByAliases(aliases.fatherName, row).trim();
        const fatherEmail = readByAliases(aliases.fatherEmail, row).trim();
        const fatherPhone = readByAliases(aliases.fatherPhone, row).trim();
        const mother = readByAliases(aliases.motherName, row).trim();
        const motherEmail = readByAliases(aliases.motherEmail, row).trim();
        const motherPhone = readByAliases(aliases.motherPhone, row).trim();
        const address = readByAliases(aliases.address, row).trim();
        const dateToJoin = readByAliases(aliases.dateToJoin, row).trim();
        const dob = readByAliases(aliases.dob, row).trim();

        // Derive display fields used by UI
        const name = [firstName, lastName].filter(Boolean).join(' ').trim();

        return {
          // Canonical fields used across the app
          name,
          email: scoutEmail,
          phone: mainPhone,

          // Full sheet-mapped fields
          firstName,
          lastName,
          rank,
          troopJob,
          mainPhone,
          scoutEmail,
          father,
          fatherEmail,
          fatherPhone,
          mother,
          motherEmail,
          motherPhone,
          address,
          dateToJoin,
          dob,

          // Timestamps for local storage mode
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      })
      .filter((contact) => {
        // Skip empty rows - must have at least one identifying field
        const hasAnyIdentifier =
          (contact.firstName && contact.firstName !== '') ||
          (contact.lastName && contact.lastName !== '') ||
          (contact.email && contact.email !== '') ||
          (contact.phone && contact.phone !== '');
        
        return hasAnyIdentifier;
      });

    return parsed;
  }

  // Get sheet metadata
  async getSheetInfo() {
    try {
      const url = `${GOOGLE_SHEETS_API_BASE}/${this.sheetId}`;
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          fields: 'sheets(properties(title,sheetId)),properties(title)'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Google Sheets info:', error);
      throw new Error('Failed to fetch sheet information');
    }
  }

  // Check if the service is configured properly
  isConfigured() {
    return !!(this.apiKey && this.sheetId);
  }

  // Validate sheet data format (relaxed for provided headers)
  validateSheetData(data) {
    const issues = [];

    data.forEach((row, index) => {
      // Check for invalid email format (scout email)
      if (row.email && row.email.trim() !== '' && !this.isValidEmail(row.email)) {
        issues.push(`Row ${index + 2}: Invalid scout email format`);
      }
      
      // Check for invalid parent email formats
      if (row.fatherEmail && row.fatherEmail.trim() !== '' && !this.isValidEmail(row.fatherEmail)) {
        issues.push(`Row ${index + 2}: Invalid father email format`);
      }
      
      if (row.motherEmail && row.motherEmail.trim() !== '' && !this.isValidEmail(row.motherEmail)) {
        issues.push(`Row ${index + 2}: Invalid mother email format`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Simple email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;