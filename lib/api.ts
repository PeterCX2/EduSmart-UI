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

        if(data.token) {
            localStorage.setItem('token', data.token);
        }

        return {success: true, data};
    } catch(error: any) {
        return {success: false, error: error.message};
    }
}