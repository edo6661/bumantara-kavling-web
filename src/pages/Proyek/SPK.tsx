import DataTable from "../../components/shared/DataTable";

const SPK = () => {
  const columns = [
    { header: 'No. SPK', accessor: 'no_spk' },
    { header: 'Nama Kontraktor', accessor: 'kontraktor' },
    { header: 'Blok Kavling', accessor: 'kavling' },
    { header: 'Nilai Proyek', accessor: 'nilai' },
    { header: 'Status', accessor: 'status' },
  ];

  const dummyData = [
    { no_spk: 'SPK/BANGUN/26/001', kontraktor: 'CV Maju Jaya', kavling: 'A-01', nilai: 'Rp 150.000.000', status: 'Berjalan' },
    { no_spk: 'SPK/BANGUN/26/002', kontraktor: 'PT Bangun Persada', kavling: 'B-12', nilai: 'Rp 120.000.000', status: 'Draft' },
  ];

  const handleAdd = () => {
    console.log('Buat SPK Baru...');
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Surat Perintah Kerja (SPK)"
        columns={columns}
        data={dummyData}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default SPK;