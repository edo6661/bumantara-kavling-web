import DataTable from "../../components/shared/DataTable";

const KelengkapanAdministrasi = () => {
  const columns = [
    { header: 'Nama Customer', accessor: 'nama' },
    { header: 'KTP', accessor: 'ktp' },
    { header: 'Kartu Keluarga', accessor: 'kk' },
    { header: 'NPWP', accessor: 'npwp' },
    { header: 'Slip Gaji', accessor: 'slip_gaji' },
    { header: 'Status Berkas', accessor: 'status' },
  ];

  const dummyData = [
    { nama: 'Budi Santoso', ktp: 'Lengkap', kk: 'Lengkap', npwp: 'Lengkap', slip_gaji: 'Lengkap', status: 'Valid' },
    { nama: 'Siti Aminah', ktp: 'Lengkap', kk: 'Lengkap', npwp: 'Belum Ada', slip_gaji: 'Lengkap', status: 'Incomplete' },
  ];

  const handleAdd = () => {
    console.log('Upload Kelengkapan Administrasi...');
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Kelengkapan Administrasi KPR"
        columns={columns}
        data={dummyData}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default KelengkapanAdministrasi;