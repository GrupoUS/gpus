# LGPD Student Data Compliance Patterns

## Overview
Lei Geral de Proteção de Dados (LGPD) compliance patterns specifically for student data management in Brazilian educational institutions.

## Core LGPD Principles for Education

### 1. Lawful Basis for Processing
**Valid Bases for Student Data:**
- Consent: Explicit consent for data processing (students ≥18 or parent consent)
- Legal Compliance: Educational record maintenance requirements
- Vital Interests: Academic progress tracking and institutional safety

### 2. Student Data Categories
**Personal Data:**
- Name, CPF, date of birth, contact information
- Address, residency status, nationality
- Academic records, grades, certificates

**Special Categories:**
- Health data (relevant for health aesthetics education)
- Biometric data (attendance systems)
- Sensitive personal information

### 3. Student Rights Implementation

#### Right of Access
```typescript
// Student data access implementation
export const getStudentData = async (studentId: string, requestorId: string) => {
  // Verify requestor authorization
  const hasPermission = await verifyRequestorAccess(requestorId, studentId)
  if (!hasPermission) throw new Error("Unauthorized access")
  
  // Log access for audit trail
  await logDataAccess(studentId, requestorId, "Student data access")
  
  // Return student data with complete processing history
  return ctx.db.get(studentId)
}
```

#### Right of Deletion
```typescript
// Student data deletion (right to be forgotten)
export const deleteStudentData = async (studentId: string, deletionReason: string) => {
  // Create retention record before deletion
  await createRetentionRecord(studentId, deletionReason, Date.now())
  
  // Delete from primary tables
  await deleteFromTables(studentId, ["students", "enrollments", "grades"])
  
  // Create deletion certificate for compliance
  await generateDeletionCertificate(studentId, deletionReason, Date.now())
}
```

#### Right of Portability
```typescript
// Student data portability
export const exportStudentData = async (studentId: string, format: 'json'|'pdf') => {
  const studentData = await getCompleteStudentProfile(studentId)
  
  // Include all processing history and sources
  const exportData = {
    personalData: studentData.personal,
    academicData: studentData.academic,
    processingHistory: studentData.processingLog,
    dataSources: studentData.sources
  }
  
  return format === 'pdf' 
    ? generatePDFExport(exportData)
    : JSON.stringify(exportData)
}
```

## Implementation Patterns

### 1. Consent Management
```typescript
// Consent tracking for student data
const consentSchema = {
  studentId: v.id('students'),
  consentType: v.union(
    v.literal('academic_processing'),
    v.literal('marketing_comms'),
    v.literal('data_sharing'),
    v.literal('biometric_attendance')
  ),
  granted: v.boolean(),
  grantedAt: v.number(),
  expiresAt: v.optional(v.number()),
  guardianConsent: v.optional(v.boolean()), // For minors
}
```

### 2. Data Minimization
```typescript
// Collect only necessary student data
const studentEnrollmentSchema = {
  // Required: Only collect what's legally necessary
  name: v.string(),
  cpf: v.string(), // Required for Brazilian educational records
  
  // Optional: Collect only when needed
  allergies: v.optional(v.string()), // Health context only
  emergencyContact: v.optional(v.string()), // Safety requirement only
  
  // Never collect: Avoid sensitive categories unless essential
  // politicalOpinion: v.string(), // ❌ Not relevant to education
}
```

### 3. Audit Trail Implementation
```typescript
// Comprehensive audit trail for student data
const auditLogSchema = {
  studentId: v.id('students'),
  action: v.string(), // "created", "accessed", "modified", "deleted"
  actorId: v.id('users'), // Who performed the action
  timestamp: v.number(),
  ipAddress: v.optional(v.string()),
  justification: v.optional(v.string()), // Legal basis for action
  dataFieldsAffected: v.optional(v.array(v.string())), // What was accessed/modified
}
```

## Brazilian Educational Context

### Student Record Types
- **Matrícula**: Enrollment records with unique identifiers
- **Histórico Escolar**: Academic transcript and progression
- **Certificados**: Course completion and professional certifications
- **Atestados**: Attendance and medical certificates

### Special Considerations
- **Menores de Idade**: Parental consent required for data processing
- **Alunos com Necessidades**: Special handling for disability accommodations
- **Saúde Estética**: Health data protection with professional context
- **Profissionalização**: Adult education context with different data protection needs

## Validation Checklist

### LGPD Compliance Items
- [ ] Data processing has lawful basis (consent/legal requirement)
- [ ] Student rights are implemented (access, deletion, portability)
- [ ] Data minimization principles applied
- [ ] Audit trails maintained for all data operations
- [ ] Consent management system implemented
- [ ] Data retention policies established
- [ ] DPO (Data Protection Officer) responsibilities defined
- [ ] Incident response procedures in place
- [ ] Privacy policy accessible and comprehensive
- [ ] International data transfer compliance (if applicable)

### Educational Sector Items
- [ ] Aligned with Lei de Diretrizes e Bases da Educação (LDB)
- [ ] Meets Ministério da Educação requirements
- [ ] Professional certification standards compliance
- [ ] Student progression tracking implemented
- [ ] Academic record integrity ensured

## Implementation Timeline

### Phase 1: Foundation (2 weeks)
- Set up consent management system
- Implement basic audit trails
- Create student data schemas with LGPD fields

### Phase 2: Rights Implementation (3 weeks)
- Implement data access procedures
- Create deletion workflows with retention
- Develop data portability features

### Phase 3: Educational Context (2 weeks)
- Add educational-specific data categories
- Implement professional certification tracking
- Create health aesthetics data handling patterns

### Phase 4: Validation & Documentation (1 week)
- Test all student rights implementations
- Document data processing purposes
- Create privacy policy and compliance procedures

## MCP Tool Integration

### Serena Integration
- Analyze existing Convex schemas for LGPD compliance gaps
- Identify student data fields requiring additional protection
- Map data processing activities across the application

### Context7 Integration
- Research latest LGPD guidance for educational institutions
- Validate against ANPD (Autoridade Nacional de Proteção de Dados) guidelines
- Compare with sector-specific compliance frameworks

### Tavily Integration
- Research current LGPD implementations in Brazilian educational systems
- Validate against community best practices
- Identify common compliance challenges and solutions

### Sequential Thinking Integration
- Multi-perspective analysis of student data handling scenarios
- Identify potential privacy risks in educational context
- Develop balanced approach between educational needs and privacy protection
