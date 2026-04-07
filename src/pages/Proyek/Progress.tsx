import DataTable from "../../components/shared/DataTable";

const Progress = () => {
  const columns = [
    { header: 'Blok Kavling', accessor: 'kavling' },
    { header: 'Kontraktor', accessor: 'kontraktor' },
    { header: 'Progress Pembangunan', accessor: 'progress' },
    { header: 'Target Selesai', accessor: 'target' },
    { header: 'Status', accessor: 'status' },
  ];

  const dummyData = [
    { kavling: 'A-01', kontraktor: 'CV Maju Jaya', progress: '45%', target: '15 Jul 2026', status: 'On Schedule' },
    { kavling: 'B-12', kontraktor: 'PT Bangun Persada', progress: '10%', target: '20 Agu 2026', status: 'Terlambat' },
  ];

  const handleAdd = () => {
    console.log('Update Progress Pembangunan...');
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Progress Pembangunan Proyek"
        columns={columns}
        data={dummyData}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default Progress;