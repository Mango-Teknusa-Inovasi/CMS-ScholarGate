@extends('errors.layout')

@section('title', 'Sesi Berakhir')
@section('code', '419')

@section('icon')
<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
@endsection

@section('message', 'Sesi keamanan halaman ini telah kadaluarsa demi melindungi data Anda. Silakan muat ulang halaman dan coba lagi.')
