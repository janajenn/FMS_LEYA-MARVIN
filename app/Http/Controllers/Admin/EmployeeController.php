<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = User::where('is_employee', true)
            ->with('role')
            ->get();
        return Inertia::render('Admin/Employees/Index', ['employees' => $employees]);
    }

    public function create()
    {
        return Inertia::render('Admin/Employees/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'employee_number' => 'required|string|unique:users',
            'position' => 'nullable|string',
            'daily_rate' => 'nullable|numeric|min:0',
        ]);

        // Find employee role (create if not exists)
        $role = Role::firstOrCreate(['slug' => 'employee'], ['name' => 'Employee']);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $role->id,
            'employee_number' => $validated['employee_number'],
            'is_employee' => true,
            'qr_code' => Str::uuid(), // or a custom hash
        ]);

        return redirect()->route('admin.employees.index')->with('success', 'Employee created.');
    }

    public function edit(User $employee)
    {
        return Inertia::render('Admin/Employees/Edit', ['employee' => $employee]);
    }

    public function update(Request $request, User $employee)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$employee->id,
            'employee_number' => 'required|string|unique:users,employee_number,'.$employee->id,
            'position' => 'nullable|string',
            'daily_rate' => 'nullable|numeric|min:0',
        ]);

        $employee->update($validated);
        return redirect()->route('admin.employees.index')->with('success', 'Employee updated.');
    }

    public function destroy(User $employee)
    {
        $employee->delete();
        return redirect()->route('admin.employees.index')->with('success', 'Employee deleted.');
    }

    // Regenerate QR code
    public function regenerateQR(User $employee)
    {
        $employee->qr_code = Str::uuid();
        $employee->save();
        return redirect()->back()->with('success', 'QR code regenerated.');
    }
}
