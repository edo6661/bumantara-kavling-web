import DataTable from "../../components/shared/DataTable";

const TimMarketing = () => {
  const columns = [
    { header: 'ID Sales', accessor: 'id_sales' },
    { header: 'Nama', accessor: 'nama' },
    { header: 'Status', accessor: 'status' },
  ];

  const dummyData = [
    { id_sales: 'MKT-001', nama: 'Andi Pratama', status: 'Aktif' },
    { id_sales: 'MKT-002', nama: 'Rina Wijaya', status: 'Aktif' },
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