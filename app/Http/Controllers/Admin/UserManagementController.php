<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $roleSlug = $request->query('role'); // manager, driver, customer
        $query = User::with('role');

        if ($roleSlug && in_array($roleSlug, ['manager', 'driver', 'customer'])) {
            $role = Role::where('slug', $roleSlug)->first();
            if ($role) {
                $query->where('role_id', $role->id);
            }
        } else {
            // Default: show all except admin? Maybe show all.
        }

        $users = $query->orderBy('name')->get();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'currentRole' => $roleSlug ?? 'all',
        ]);
    }

    public function create(Request $request)
    {
        $roleSlug = $request->query('role');
        $roles = Role::whereIn('slug', ['manager', 'driver'])->get();
        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
            'selectedRole' => $roleSlug ?? 'manager',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
        ]);

        return redirect()->route('admin.users.index', ['role' => $user->role->slug])
            ->with('success', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $roles = Role::whereIn('slug', ['manager', 'driver'])->get();
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id',
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()->route('admin.users.index', ['role' => $user->role->slug])
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        $roleSlug = $user->role->slug;
        $user->delete();

        return redirect()->route('admin.users.index', ['role' => $roleSlug])
            ->with('success', 'User deleted successfully.');
    }
}
