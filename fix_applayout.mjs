import fs from 'fs';

let content = fs.readFileSync('client/src/components/AppLayout.jsx', 'utf-8');

const fallbackUI = `  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-black/5">
          <div className="w-16 h-16 bg-[#105D5E]/10 text-[#105D5E] rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#293E33] mb-3">No Group Selected</h2>
          <p className="text-[#767F7D] mb-8">Please select a group from your home screen or join a new one.</p>
          <button 
            onClick={() => navigate('/home')}
            className="w-full bg-[#105D5E] hover:bg-[#0D4A4B] text-white font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }`;

content = content.replace("  if (!currentGroup) return null;", fallbackUI);

fs.writeFileSync('client/src/components/AppLayout.jsx', content);
console.log("Updated AppLayout.jsx");
