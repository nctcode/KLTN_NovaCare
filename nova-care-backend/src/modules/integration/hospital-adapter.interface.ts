export interface IHospitalDataAdapter {
  getPatientEncounters(
    patientProfileId: string,
    hospitalId: string,
  ): Promise<any[]>;
}
