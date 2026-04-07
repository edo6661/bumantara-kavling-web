import DataTable from "../../components/shared/DataTable";

const DataSosial = () => {
  const columns = [
    { header: 'NIK', accessor: 'nik' },
    { header: 'Nama Lengkap', accessor: 'nama' },
    { header: 'No. WhatsApp', accessor: 'phone' },
    { header: 'Pekerjaan', accessor: 'pekerjaan' },
    { header: 'Domisili', accessor: 'domisili' },
  ];

  const dummyData = [
    { nik: '3671012345670001', nama: 'Budi Santoso', phone: '081234567890', pekerjaan: 'Pegawai Swasta', domisili: 'Tangerang' },
    { nik: '3671012345670002', nama: 'Siti Aminah', phone: '081987654321', pekerjaan: 'PNS', domisili: 'Jakarta Barat' },
  ];

  const handleAdd = () => {
    console.log('Tambah Data Sosial Customer...');
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Sosial Customer"
        columns={columns}
        data={dummyData}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default DataSosial;