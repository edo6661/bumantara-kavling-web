import DataTable from "../../components/shared/DataTable";

const Penjualan = () => {
  const columns = [
    { header: 'ID Transaksi', accessor: 'id' },
    { header: 'Tanggal', accessor: 'tanggal' },
    { header: 'Nama Customer', accessor: 'customer' },
    { header: 'Blok Kavling', accessor: 'kavling' },
    { header: 'Total Harga', accessor: 'total' },
    { header: 'Status', accessor: 'status' },
  ];

  const dummyData = [
    { id: 'TRX-001', tanggal: '01 Apr 2026', customer: 'Budi Santoso', kavling: 'A-01', total: 'Rp 500.000.000', status: 'Lunas' },
    { id: 'TRX-002', tanggal: '05 Apr 2026', customer: 'Siti Aminah', kavling: 'B-12', total: 'Rp 450.000.000', status: 'Cicilan' },
  ];

  const handleAdd = () => {
    console.log('Tambah data Penjualan...');
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Data Penjualan"
        columns={columns}
        data={dummyData}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default Penjualan;