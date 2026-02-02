export async function login(email: string, password: string) {
    try {
        console.log('🔐 Attempting login with:', { email });
        
        const response = await fetch('http://edusmart.test/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        console.log('📊 Response status:', response.status);
        
        // Cek dulu apakah response adalah JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned non-JSON response');
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if(!response.ok) {
            throw new Error(data.message || `Login failed: ${response.status}`);
        }

        if(data.token && data.user) {
            // SIMPAN KE LOCALSTORAGE
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            console.log('✅ Token stored:', data.token.substring(0, 20) + '...');
            console.log('✅ User stored:', data.user);
            
            // KIRIM RESPONSE SUCCESS
            return {
                success: true, 
                data: data,
                token: data.token,
                user: data.user
            };
        } else {
            throw new Error('No token or user data in response');
        }
    } catch(error: any) {
        console.error('❌ Login error details:', error);
        return {
            success: false, 
            error: error.message
        };
    }
}