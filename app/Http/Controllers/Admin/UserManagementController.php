<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $roleSlug = $request->query('role');
        $query = User::with('role');

        if ($roleSlug && in_array($roleSlug, ['manager', 'driver', 'customer'])) {
            $role = Role::where('slug', $roleSlug)->first();
            if ($role) {
                $query->where('role_id', $role->id);
            }
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
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users',
            'password'        => 'required|string|min:8|confirmed',
            'role_id'         => 'required|exists:roles,id',
            'photo'           => 'nullable|image|max:4096',
            'assistant_name'  => 'nullable|string|max:255',
            'assistant_photo' => 'nullable|image|max:4096',
        ]);

        $data = [
            'name'           => $validated['name'],
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'role_id'        => $validated['role_id'],
            'assistant_name' => $validated['assistant_name'] ?? null,
        ];

        if ($request->hasFile('photo')) {
            $data['photo_path'] = $request->file('photo')->store('users/photos', 'public');
        }
        if ($request->hasFile('assistant_photo')) {
            $data['assistant_photo_path'] = $request->file('assistant_photo')->store('users/assistant-photos', 'public');
        }

        $user = User::create($data);

        return redirect()->route('admin.users.index', ['role' => $user->role->slug])
            ->with('success', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $roles = Role::whereIn('slug', ['manager', 'driver'])->get();
        return Inertia::render('Admin/Users/Edit', [
            'user'  => $user,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'                   => 'required|string|max:255',
            'email'                  => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password'               => 'nullable|string|min:8|confirmed',
            'role_id'                => 'required|exists:roles,id',
            'photo'                  => 'nullable|image|max:4096',
            'assistant_name'         => 'nullable|string|max:255',
            'assistant_photo'        => 'nullable|image|max:4096',
            'remove_photo'           => 'nullable|boolean',
            'remove_assistant_photo' => 'nullable|boolean',
        ]);

        $data = [
            'name'           => $validated['name'],
            'email'          => $validated['email'],
            'role_id'        => $validated['role_id'],
            'assistant_name' => $validated['assistant_name'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        // ── Driver photo ──
        if ($request->hasFile('photo')) {
            if ($user->photo_path) {
                Storage::disk('public')->delete($user->photo_path);
            }
            $data['photo_path'] = $request->file('photo')->store('users/photos', 'public');
        } elseif ($request->boolean('remove_photo') && $user->photo_path) {
            Storage::disk('public')->delete($user->photo_path);
            $data['photo_path'] = null;
        }

        // ── Assistant photo ──
        if ($request->hasFile('assistant_photo')) {
            if ($user->assistant_photo_path) {
                Storage::disk('public')->delete($user->assistant_photo_path);
            }
            $data['assistant_photo_path'] = $request->file('assistant_photo')->store('users/assistant-photos', 'public');
        } elseif ($request->boolean('remove_assistant_photo') && $user->assistant_photo_path) {
            Storage::disk('public')->delete($user->assistant_photo_path);
            $data['assistant_photo_path'] = null;
        }

        // If admin cleared the assistant name, drop the assistant photo too
        if (empty($data['assistant_name']) && $user->assistant_photo_path && !$request->hasFile('assistant_photo')) {
            Storage::disk('public')->delete($user->assistant_photo_path);
            $data['assistant_photo_path'] = null;
        }

        $user->update($data);

        return redirect()->route('admin.users.index', ['role' => $user->role->slug])
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        if ($user->photo_path) {
            Storage::disk('public')->delete($user->photo_path);
        }
        if ($user->assistant_photo_path) {
            Storage::disk('public')->delete($user->assistant_photo_path);
        }

        $roleSlug = $user->role->slug;
        $user->delete();

        return redirect()->route('admin.users.index', ['role' => $roleSlug])
            ->with('success', 'User deleted successfully.');
    }
}
