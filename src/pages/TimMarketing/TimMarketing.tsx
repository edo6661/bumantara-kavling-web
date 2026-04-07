import DataTable from "../../components/shared/DataTable";

const TimMarketing = () => {
  const columns = [
    { header: 'ID Sales', accessor: 'id_sales' },
    { header: 'Nama', accessor: 'nama' },
    { header: 'Target (Bulan Ini)', accessor: 'target' },
    { header: 'Pencapaian', accessor: 'pencapaian' },
    { header: 'Status', accessor: 'status' },
  ];

  const dummyData = [
    { id_sales: 'MKT-001', nama: 'Andi Pratama', target: '5 Unit', pencapaian: '4 Unit', status: 'Aktif' },
    { id_sales: 'MKT-002', nama: 'Rina Wijaya', target: '5 Unit', pencapaian: '6 Unit', status: 'Aktif' },
  ];

  const handleAdd = () => {
    console.log('Tambah Anggota Tim Marketing...');
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Tim Marketing"
        columns={columns}
        data={dummyData}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default TimMarketing;