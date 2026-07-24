package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.User
import com.example.kltn_novacare.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object Initial : AuthState()
    object Loading : AuthState()
    data class Authenticated(val user: User) : AuthState()
    object Unauthenticated : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel(private val authRepository: AuthRepository = AuthRepository()) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Initial)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkAuthStatus()
    }

    fun checkAuthStatus() {
        if (authRepository.isLoggedIn()) {
            val user = authRepository.getCurrentUser()
            if (user != null) {
                _authState.value = AuthState.Authenticated(user)
            } else {
                _authState.value = AuthState.Unauthenticated
            }
        } else {
            _authState.value = AuthState.Unauthenticated
        }
    }

    fun getCurrentUser(): User? {
        return authRepository.getCurrentUser()
    }

    fun login(email: String?, phone: String?, password: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = authRepository.login(email, phone, password)
            result.fold(
                onSuccess = { authResponse ->
                    _authState.value = AuthState.Authenticated(authResponse.user)
                    onSuccess()
                },
                onFailure = { error ->
                    _authState.value = AuthState.Error(error.message ?: "Đăng nhập thất bại")
                }
            )
        }
    }

    fun register(fullName: String, email: String?, phone: String?, password: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = authRepository.register(fullName, email, phone, password)
            result.fold(
                onSuccess = { authResponse ->
                    _authState.value = AuthState.Authenticated(authResponse.user)
                    onSuccess()
                },
                onFailure = { error ->
                    _authState.value = AuthState.Error(error.message ?: "Đăng ký thất bại")
                }
            )
        }
    }

    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            authRepository.logout()
            _authState.value = AuthState.Unauthenticated
            onComplete()
        }
    }
}
