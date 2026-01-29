export async function login(email: string, password: string) {
    try {
        const response = await fetch('http://edusmart.test/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        const data = await response.json();
        
        if(!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        if(data.token && data.user) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return {success: true, data};
    } catch(error: any) {
        return {success: false, error: error.message};
    }
}

export function getCurrentUser() {
    const user = localStorage.getItem('user');
    if(!user) return null;

    try {
        return JSON.parse(user)
    } catch {
        return null;
    }
}