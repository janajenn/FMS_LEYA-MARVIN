<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::orderBy('name')->get();

        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Employees/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'position'       => 'nullable|string|max:255',
            'notes'          => 'nullable|string',
        ]);

        $validated['employee_number'] = Employee::generateEmployeeNumber();
        $validated['is_active']       = true;

        Employee::create($validated);

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Employee created.');
    }

    public function edit(Employee $employee)
    {
        return Inertia::render('Admin/Employees/Edit', [
            'employee' => $employee,
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'position'       => 'nullable|string|max:255',
            'notes'          => 'nullable|string',
            'is_active'      => 'sometimes|boolean',
        ]);

        $employee->update($validated);

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Employee updated.');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Employee removed.');
    }
}
