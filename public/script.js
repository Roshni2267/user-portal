document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('saved') === '1') {
    alert('All details saved successfully ✅');
  }

  // Admin page fetch
  const adminTable = document.getElementById('admin-table-body');
  if (adminTable) {
    fetch('/api/admin/profiles')
      .then(res => res.json())
      .then(data => {
        adminTable.innerHTML = '';
        data.forEach((row, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${row.user_name || ''}</td>
            <td>${row.first_name || ''}</td>
            <td>${row.last_name || ''}</td>
            <td>${row.phone || ''}</td>
            <td>${row.email || ''}</td>
            <td>${row.address || ''}</td>
            <td>${row.created_at || ''}</td>
          `
            <td><button onclick="deleteUser(${row.user_id})" style="background:#e53935;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">Delete</button></td>
          `;
          adminTable.appendChild(tr);
        });
      })
      .catch(err => {
        console.error('Error fetching admin data', err);
      });
  }
});


function deleteUser(id) {
  if (confirm("Are you sure you want to delete this user?")) {
    fetch(`/admin/delete/${id}`, { method: 'DELETE' })
      .then(() => location.reload())
      .catch(err => console.error(err));
  }
}
