import DataTable from "../../components/shared/DataTable";

const Kavling = () => {
  const columns = [
    { header: 'Blok/Nomor', accessor: 'blok' },
    { header: 'Tipe', accessor: 'tipe' },
    { header: 'Luas Tanah', accessor: 'luas' },
    { header: 'Harga Jual', accessor: 'harga' },
    { header: 'Status', accessor: 'status' },
  ];

  const dummyData = [
    { blok: 'A-01', tipe: '45/90', luas: '90 m²', harga: 'Rp 500.000.000', status: 'Terjual' },
    { blok: 'A-02', tipe: '45/90', luas: '90 m²', harga: 'Rp 500.000.000', status: 'Available' },
    { blok: 'B-12', tipe: '36/72', luas: '72 m²', harga: 'Rp 450.000.000', status: 'Booking' },
  ];

  const handleAdd = () => {
    console.log('Tambah data Kavling...');
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Master Data Kavling"
        columns={columns}
        data={dummyData}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default Kavling;