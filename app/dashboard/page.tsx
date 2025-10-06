export default function DashboardPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Uploaded PDFs</h2>
          <p className="text-gray-600">Manage your PDF documents</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Chat History</h2>
          <p className="text-gray-600">View your chat conversations</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Quiz Results</h2>
          <p className="text-gray-600">Track your quiz performance</p>
        </div>
      </div>
    </div>
  );
}