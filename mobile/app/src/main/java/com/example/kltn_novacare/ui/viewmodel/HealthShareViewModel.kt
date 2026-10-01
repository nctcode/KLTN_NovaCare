package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.CreateHealthShareRequest
import com.example.kltn_novacare.data.model.HealthShare
import com.example.kltn_novacare.data.repository.HealthShareRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class HealthShareViewModel(private val repository: HealthShareRepository = HealthShareRepository()) : ViewModel() {
    private val _shares = MutableStateFlow<NetworkState<List<HealthShare>>>(NetworkState.Idle)
    val shares = _shares.asStateFlow()
    private val _operation = MutableStateFlow<NetworkState<Unit>>(NetworkState.Idle)
    val operation = _operation.asStateFlow()
    private var loadJob: Job? = null

    fun loadShares() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _shares.value = NetworkState.Loading
            repository.getShares().fold(
                onSuccess = { _shares.value = NetworkState.Success(it) },
                onFailure = { _shares.value = NetworkState.Error(it.message ?: "Không thể tải mã chia sẻ") }
            )
        }
    }

    fun resetOperation() {
        if (_operation.value !is NetworkState.Loading) _operation.value = NetworkState.Idle
    }

    fun createShare(request: CreateHealthShareRequest, onSuccess: () -> Unit) {
        if (_operation.value is NetworkState.Loading) return
        _operation.value = NetworkState.Loading
        viewModelScope.launch {
            repository.createShare(request).fold(
                onSuccess = { share ->
                    loadJob?.cancel()
                    val previous = (_shares.value as? NetworkState.Success)?.data.orEmpty()
                    _shares.value = NetworkState.Success(listOf(share) + previous.filterNot { it.id == share.id })
                    _operation.value = NetworkState.Success(Unit)
                    onSuccess()
                },
                onFailure = { _operation.value = NetworkState.Error(it.message ?: "Không thể tạo mã chia sẻ") }
            )
        }
    }

    fun revokeShare(id: String, onSuccess: () -> Unit) {
        if (_operation.value is NetworkState.Loading) return
        _operation.value = NetworkState.Loading
        viewModelScope.launch {
            repository.revokeShare(id).fold(
                onSuccess = {
                    loadJob?.cancel()
                    val previous = (_shares.value as? NetworkState.Success)?.data.orEmpty()
                    _shares.value = NetworkState.Success(previous.map { if (it.id == id) it.copy(isActive = false) else it })
                    _operation.value = NetworkState.Success(Unit)
                    onSuccess()
                },
                onFailure = { _operation.value = NetworkState.Error(it.message ?: "Không thể thu hồi mã chia sẻ") }
            )
        }
    }
}
