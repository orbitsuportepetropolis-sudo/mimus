const baseUrl = 'https://mimus-llt5qjc1z-mimus-projects1.vercel.app';
const paths = ['', '/login', '/register', '/dashboard'];

async function check() {
  for (const path of paths) {
    const url = `${baseUrl}${path}`;
    try {
      const res = await fetch(url);
      console.log(`${url}: Status ${res.status}`);
    } catch (err) {
      console.log(`${url}: Failed (${err.message})`);
    }
  }
}

check();
