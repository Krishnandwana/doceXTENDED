\
\
\
   

import re
from typing import Dict, Any, Optional, List
from datetime import datetime


class DocumentParser:
                                                      

                                                 
    PATTERNS = {
        'pan': {
            'pan_number': r'[A-Z]{5}[0-9]{4}[A-Z]',
            'dob': r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        },
        'aadhaar': {
            'aadhaar_number': r'\b\d{4}\s?\d{4}\s?\d{4}\b',
            'aadhaar_number_compact': r'\b\d{12}\b',
            'dob': r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        },
        'driving_license': {
            'license_number': r'[A-Z]{2}[-/]?\d{2}[-/]?\d{4}[-/]?\d{7}',
            'license_number_alt': r'[A-Z]{2}\d{13,16}',
            'dob': r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        },
        'passport': {
            'passport_number': r'[A-Z]\d{7}',
            'dob': r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        },
        'voter_id': {
            'voter_id': r'[A-Z]{3}\d{7}',
            'dob': r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        }
    }

                                            
    REQUIRED_FIELDS = {
        'aadhaar': ['name', 'aadhaar_number', 'dob'],
        'pan': ['name', 'pan_number', 'father_name'],
        'driving_license': ['name', 'license_number', 'dob'],
        'passport': ['name', 'passport_number', 'dob'],
        'voter_id': ['name', 'voter_id']
    }

    def parse_document(self, text: str, document_type: str, structured_data: Optional[Dict] = None) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
\
\
           
                                                                
        if structured_data and isinstance(structured_data, dict):
            return self._validate_and_clean_data(structured_data, document_type)

                                               
        parsed = {}

        if document_type == 'aadhaar':
            parsed = self._parse_aadhaar(text)
        elif document_type == 'pan':
            parsed = self._parse_pan(text)
        elif document_type == 'driving_license':
            parsed = self._parse_driving_license(text)
        elif document_type == 'passport':
            parsed = self._parse_passport(text)
        elif document_type == 'voter_id':
            parsed = self._parse_voter_id(text)

        return self._validate_and_clean_data(parsed, document_type)

    def _parse_aadhaar(self, text: str) -> Dict[str, Any]:
                                     
        parsed = {}

                                
        aadhaar_match = re.search(self.PATTERNS['aadhaar']['aadhaar_number'], text)
        if not aadhaar_match:
            aadhaar_match = re.search(self.PATTERNS['aadhaar']['aadhaar_number_compact'], text)

        if aadhaar_match:
            aadhaar_num = aadhaar_match.group(0).replace(' ', '')
            parsed['aadhaar_number'] = f"{aadhaar_num[:4]} {aadhaar_num[4:8]} {aadhaar_num[8:]}"

                     
        dob_match = re.search(self.PATTERNS['aadhaar']['dob'], text)
        if dob_match:
            parsed['dob'] = dob_match.group(0)

                        
        if 'male' in text.lower() and 'female' not in text.lower():
            parsed['gender'] = 'Male'
        elif 'female' in text.lower():
            parsed['gender'] = 'Female'

                                                              
        name_match = re.search(r'(?:Name|NAME|नाम)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', text, re.IGNORECASE)
        if name_match:
            parsed['name'] = name_match.group(1).strip()

        return parsed

    def _parse_pan(self, text: str) -> Dict[str, Any]:
                                 
        parsed = {}

                            
        pan_match = re.search(self.PATTERNS['pan']['pan_number'], text)
        if pan_match:
            parsed['pan_number'] = pan_match.group(0)

                     
        dob_match = re.search(self.PATTERNS['pan']['dob'], text)
        if dob_match:
            parsed['dob'] = dob_match.group(0)

                                                              
        name_match = re.search(r'(?:Name|NAME)[:\s]*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)', text, re.IGNORECASE)
        if name_match:
            parsed['name'] = name_match.group(1).strip()

                                                                       
        father_match = re.search(r'(?:Father|FATHER|Father\'s Name)[:\s]*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)', text, re.IGNORECASE)
        if father_match:
            parsed['father_name'] = father_match.group(1).strip()

        return parsed

    def _parse_driving_license(self, text: str) -> Dict[str, Any]:
                                        
        parsed = {}

                                
        license_match = re.search(self.PATTERNS['driving_license']['license_number'], text)
        if not license_match:
            license_match = re.search(self.PATTERNS['driving_license']['license_number_alt'], text)

        if license_match:
            parsed['license_number'] = license_match.group(0)

                     
        dob_match = re.search(self.PATTERNS['driving_license']['dob'], text)
        if dob_match:
            parsed['dob'] = dob_match.group(0)

                      
        name_match = re.search(r'(?:Name|NAME)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', text, re.IGNORECASE)
        if name_match:
            parsed['name'] = name_match.group(1).strip()

        return parsed

    def _parse_passport(self, text: str) -> Dict[str, Any]:
                                 
        parsed = {}

                                 
        passport_match = re.search(self.PATTERNS['passport']['passport_number'], text)
        if passport_match:
            parsed['passport_number'] = passport_match.group(0)

                     
        dob_match = re.search(self.PATTERNS['passport']['dob'], text)
        if dob_match:
            parsed['dob'] = dob_match.group(0)

                      
        name_match = re.search(r'(?:Name|NAME)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', text, re.IGNORECASE)
        if name_match:
            parsed['name'] = name_match.group(1).strip()

        return parsed

    def _parse_voter_id(self, text: str) -> Dict[str, Any]:
                                 
        parsed = {}

                          
        voter_match = re.search(self.PATTERNS['voter_id']['voter_id'], text)
        if voter_match:
            parsed['voter_id'] = voter_match.group(0)

                     
        dob_match = re.search(self.PATTERNS['voter_id']['dob'], text)
        if dob_match:
            parsed['dob'] = dob_match.group(0)

                      
        name_match = re.search(r'(?:Name|NAME)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', text, re.IGNORECASE)
        if name_match:
            parsed['name'] = name_match.group(1).strip()

        return parsed

    def _validate_and_clean_data(self, data: Dict[str, Any], document_type: str) -> Dict[str, Any]:
                                            
        cleaned = {}

        for key, value in data.items():
            if value and value != 'null' and value is not None:
                                     
                if isinstance(value, str):
                    value = value.strip()
                    if value.lower() != 'null' and value != '':
                        cleaned[key] = value
                else:
                    cleaned[key] = value

        return cleaned

    def validate_document_data(self, data: Dict[str, Any], document_type: str) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
\
           
        errors = []
        warnings = []

                               
        required = self.REQUIRED_FIELDS.get(document_type, [])
        for field in required:
            if field not in data or not data[field]:
                errors.append(f"Missing required field: {field}")

                                  
        if document_type == 'pan' and 'pan_number' in data:
            if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', data['pan_number']):
                errors.append("Invalid PAN number format")

        if document_type == 'aadhaar' and 'aadhaar_number' in data:
            aadhaar_clean = data['aadhaar_number'].replace(' ', '')
            if not re.match(r'^\d{12}$', aadhaar_clean):
                errors.append("Invalid Aadhaar number format")

        if document_type == 'passport' and 'passport_number' in data:
            if not re.match(r'^[A-Z]\d{7}$', data['passport_number']):
                errors.append("Invalid passport number format")

                                 
        if 'dob' in data:
            try:
                                   
                date_formats = ['%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%d-%m-%y']
                parsed_date = None
                for fmt in date_formats:
                    try:
                        parsed_date = datetime.strptime(data['dob'], fmt)
                        break
                    except:
                        continue

                if not parsed_date:
                    warnings.append("Could not validate date of birth format")
                elif parsed_date > datetime.now():
                    errors.append("Date of birth cannot be in the future")
            except:
                warnings.append("Could not validate date of birth")

        is_valid = len(errors) == 0

        return {
            'is_valid': is_valid,
            'errors': errors,
            'warnings': warnings,
            'validation_details': {
                'required_fields_present': all(field in data for field in required)
            }
        }

    def verify_bill_total(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
\
\
\
\
\
\
\
\
           
        try:
            line_items = parsed_data.get('line_items', [])
            total_amount = parsed_data.get('total_amount')

            if not line_items or total_amount is None:
                return {
                    'success': False,
                    'error': 'Missing line items or total amount for verification.'
                }

                                            
            try:
                total_amount = float(total_amount)
            except (ValueError, TypeError):
                return {
                    'success': False,
                    'error': f'Invalid total amount format: {total_amount}'
                }

                                         
            calculated_total = 0.0
            for item in line_items:
                price = item.get('price')
                if price is not None:
                    try:
                        calculated_total += float(price)
                    except (ValueError, TypeError):
                                                                
                        pass
            
                                                                                                                 
            is_total_correct = abs(calculated_total - total_amount) < 0.01

            return {
                'success': True,
                'calculated_total': round(calculated_total, 2),
                'stated_total': total_amount,
                'is_total_correct': is_total_correct,
                'discrepancy': round(abs(calculated_total - total_amount), 2)
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


_parser = None

def get_document_parser() -> DocumentParser:
    global _parser
    if _parser is None:
        _parser = DocumentParser()
    return _parser
