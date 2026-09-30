@extends('errors.layout')

@section('title', 'Halaman Tidak Ditemukan')
@section('code', '404')

@section('icon')
<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
</svg>
@endsection

@section('message', 'Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada. Silakan periksa kembali tautan yang Anda buka.')
