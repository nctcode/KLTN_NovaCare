import { Injectable } from '@nestjs/common';

export interface ICDMatchResult {
  diseaseName: string;
  icdCode: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  specialtyName?: string;
}

@Injectable()
export class ICDCandidateResolverService {
  // Authoritative validated ICD-10 catalog in system
  private readonly icdCatalog: Array<{ code: string; name: string; keywords: string[]; specialty: string }> = [
    { code: 'M25.5', name: 'Đau khớp / Viêm khớp thành ngực', keywords: ['ấn vào đau', 'sụn sườn', 'xoay người', 'đau thành ngực'], specialty: 'Cơ xương khớp' },
    { code: 'M54.6', name: 'Đau cột sống ngực', keywords: ['cột sống', 'lưng ngực'], specialty: 'Cơ xương khớp' },
    { code: 'J20', name: 'Viêm phế quản cấp', keywords: ['ho', 'đờm', 'sốt'], specialty: 'Hô hấp' },
    { code: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên', keywords: ['sốt', 'họng', 'ho'], specialty: 'Tai Mũi Họng' },
    { code: 'I20.9', name: 'Cơn đau thắt ngực nghi do thiếu máu cơ tim', keywords: ['đè nặng', 'bóp nghẹt', 'lan tay', 'lan hàm'], specialty: 'Tim mạch' },
    { code: 'R00.2', name: 'Cảm giác tim đập nhanh / Hồi hộp', keywords: ['hồi hộp', 'đánh trống ngực', 'bỏ nhịp'], specialty: 'Tim mạch' },
    { code: 'K21.9', name: 'Bệnh trào ngược dạ dày thực quản', keywords: ['trào ngược', 'ợ chua', 'nóng rát sau xương ức'], specialty: 'Tiêu hóa' },
  ];

  resolve(candidateTerms: string[], specialtyName: string, textContext: string): ICDMatchResult[] {
    const textLower = textContext.toLowerCase();
    const results: ICDMatchResult[] = [];

    candidateTerms.forEach((term) => {
      const termLower = term.toLowerCase();
      // Find matching entry from catalog
      const match = this.icdCatalog.find((entry) => {
        const matchesSpecialty = entry.specialty.toLowerCase() === specialtyName.toLowerCase();
        const matchesKeyword = entry.keywords.some((kw) => textLower.includes(kw) || termLower.includes(kw));
        return matchesSpecialty && matchesKeyword;
      });

      if (match && match.code !== 'R69' && match.code !== 'F45.3') {
        results.push({
          diseaseName: match.name,
          icdCode: match.code,
          confidence: 'MEDIUM',
          specialtyName: match.specialty,
        });
      } else {
        // If term cannot be matched to authoritative catalog with high confidence, set icdCode: null!
        results.push({
          diseaseName: term,
          icdCode: null, // DO NOT INVENT R69 OR F45.3!
          confidence: 'LOW',
        });
      }
    });

    // Remove duplicates
    const uniqueMap = new Map<string, ICDMatchResult>();
    results.forEach((r) => {
      const key = `${r.diseaseName}_${r.icdCode}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, r);
    });

    return Array.from(uniqueMap.values()).slice(0, 3);
  }
}
