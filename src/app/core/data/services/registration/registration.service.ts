import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
    constructor(private http: HttpClient) {
    }
    register(name: string, email: string, password: string, confirmPassword: string) {

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type':  'application/json'
            })
        };

        return this.http.post<any>(
            environment.apiUrl + 'accounts/create',
            { name, email, password, confirmPassword },
            httpOptions
        )
        .pipe(tap(res => {
            return res;
        }));
    }
}
