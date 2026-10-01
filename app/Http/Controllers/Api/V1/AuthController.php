<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Register a new customer and return an API token.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:8|confirmed',
            'device_name' => 'required|string|max:100',
        ]);

        $customerRole = Role::where('slug', 'customer')->firstOrFail();

        $user = DB::transaction(function () use ($data, $customerRole) {
            return User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'role_id'  => $customerRole->id,
            ]);
        });

        $token = $user->createToken($data['device_name'])->plainTextToken;

        return response()->json([
            'data' => [
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => 'customer',
                ],
                'token' => $token,
            ],
            'message' => 'Registration successful.',
        ], 201);
    }

    /**
     * Login a customer and return an API token.
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'       => 'required|email',
            'password'    => 'required|string',
            'device_name' => 'required|string|max:100',
        ]);

        $user = User::with('role')->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (optional($user->role)->slug !== 'customer') {
            throw ValidationException::withMessages([
                'email' => ['This app is only available for customers.'],
            ]);
        }

        // Revoke any old tokens from this device before issuing a new one
        $user->tokens()->where('name', $data['device_name'])->delete();

        $token = $user->createToken($data['device_name'])->plainTextToken;

        return response()->json([
            'data' => [
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => optional($user->role)->slug,
                ],
                'token' => $token,
            ],
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Get the currently authenticated user.
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('role');

        return response()->json([
            'data' => [
                'user' => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => optional($user->role)->slug,
                ],
            ],
        ]);
    }

    /**
     * Revoke the current access token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
