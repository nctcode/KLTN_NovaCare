export interface IHospitalDataAdapter {
  getPatientEncounters(
    patientProfileId: string,
    hospitalId: string,
    encounterIds?: string[],
  ): Promise<any[]>;
}
