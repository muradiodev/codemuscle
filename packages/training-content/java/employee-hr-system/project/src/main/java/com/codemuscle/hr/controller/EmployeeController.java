package com.codemuscle.hr.controller;

import com.codemuscle.hr.dto.EmployeeCreateRequest;
import com.codemuscle.hr.dto.EmployeeResponse;
import com.codemuscle.hr.model.LeaveRequest;
import com.codemuscle.hr.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeCreateRequest request) {
        EmployeeResponse response = employeeService.create(request);
        return ResponseEntity.created(URI.create("/api/employees/" + response.id())).body(response);
    }

    @GetMapping("/{id}")
    public EmployeeResponse find(@PathVariable String id) {
        return employeeService.find(id);
    }

    @GetMapping
    public List<EmployeeResponse> search(@RequestParam(defaultValue = "") String query) {
        return employeeService.search(query);
    }

    @PutMapping("/{id}")
    public EmployeeResponse replace(@PathVariable String id,
                                    @Valid @RequestBody EmployeeCreateRequest request) {
        return employeeService.replace(id, request);
    }

    @PatchMapping("/{id}/status")
    public EmployeeResponse changeStatus(@PathVariable String id,
                                         @RequestParam com.codemuscle.hr.model.EmployeeStatus status) {
        return employeeService.changeStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/statistics/departments")
    public Map<String, Long> departmentCounts() {
        return employeeService.countByDepartment();
    }

    @PostMapping("/{id}/leave")
    public LeaveRequest leave(@PathVariable String id, @Valid @RequestBody LeaveRequest body) {
        return employeeService.requestLeave(new LeaveRequest(body.id(), id, body.from(), body.to(), body.reason()));
    }
}
