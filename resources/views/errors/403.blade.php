@extends('errors::minimal')

@section('code', '403')
@section('title', 'Akses Ditolak')
@section('message', $exception->getMessage() ?: 'Kamu tidak punya izin untuk membuka halaman ini.')
