import DataTable from "../../components/shared/DataTable";

const SPR = () => {
  const columns = [
    { header: 'No. SPR', accessor: 'no_spr' },
    { header: 'Tanggal', accessor: 'tanggal' },
    { header: 'Nama Pemesan', accessor: 'pemesan' },
    { header: 'Blok Kavling', accessor: 'kavling' },
    { header: 'Status Approval', accessor: 'status' },
  ];

  const dummyData = [
    { no_spr: 'SPR/2026/04/001', tanggal: '01 Apr 2026', pemesan: 'Budi Santoso', kavling: 'A-01', status: 'Approved' },
    { no_spr: 'SPR/2026/04/002', tanggal: '05 Apr 2026', pemesan: 'Siti Aminah', kavling: 'B-12', status: 'Pending Review' },
  ];

  const handleAdd = () => {
    console.log('Buat SPR Baru...');
  };

  return (
    <div className="space-y-6">
      <DataTable
        title="Surat Pemesanan Rumah (SPR)"
        columns={columns}
        data={dummyData}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default SPR;