/**
 * Generates four distinct Spring Boot practice projects as on-disk source trees.
 * Run: node scripts/generate-projects.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "java");

const pom = (artifact, name) => `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.2</version>
  </parent>
  <groupId>com.codemuscle</groupId>
  <artifactId>${artifact}</artifactId>
  <version>1.0.0</version>
  <name>${name}</name>
  <properties>
    <java.version>21</java.version>
    <mapstruct.version>1.6.3</mapstruct.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>
    <dependency>
      <groupId>org.mapstruct</groupId>
      <artifactId>mapstruct</artifactId>
      <version>\${mapstruct.version}</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <configuration>
          <annotationProcessorPaths>
            <path>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
              <version>\${lombok.version}</version>
            </path>
            <path>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok-mapstruct-binding</artifactId>
              <version>0.2.0</version>
            </path>
            <path>
              <groupId>org.mapstruct</groupId>
              <artifactId>mapstruct-processor</artifactId>
              <version>\${mapstruct.version}</version>
            </path>
          </annotationProcessorPaths>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
`;

const yml = (name) => `spring:
  application:
    name: ${name}
server:
  port: 8080
`;

function write(projectDir, relative, content) {
  const path = join(projectDir, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.replace(/\r?\n/g, "\n"), "utf8");
}

function writeManifest(slug, meta, files) {
  const dir = join(root, slug);
  write(dir, "manifest.json", JSON.stringify({
    id: slug,
    name: meta.name,
    language: "java",
    version: "1.0.0",
    description: meta.description,
    difficulty: meta.difficulty,
    order: meta.order,
    files: files.map((f, i) => ({
      path: f.path,
      difficulty: f.difficulty ?? "intermediate",
      order: f.order ?? i + 1,
      estimatedMinutes: f.estimatedMinutes ?? Math.max(4, Math.ceil((f.code.split("\n").length) / 6)),
      topics: f.topics ?? []
    }))
  }, null, 2));
  write(dir, "project/pom.xml", pom(slug, meta.name));
  write(dir, "project/src/main/resources/application.yml", yml(slug));
  for (const f of files) write(dir, join("project", f.path), f.code);
  if (meta.test) write(dir, join("project", meta.test.path), meta.test.code);
  console.log(`${slug}: ${files.length} practice files`);
}

// ─── 1. Employee HR ───────────────────────────────────────────────────────────
{
  const p = "src/main/java/com/codemuscle/hr";
  const files = [
    { path: `${p}/HrApplication.java`, difficulty: "warmup", topics: ["spring-boot","dependency-injection"], code: `package com.codemuscle.hr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HrApplication {
    public static void main(String[] args) {
        SpringApplication.run(HrApplication.class, args);
    }
}
` },
    { path: `${p}/model/EmployeeStatus.java`, difficulty: "warmup", topics: ["enums","domain-modeling"], code: `package com.codemuscle.hr.model;

public enum EmployeeStatus {
    CANDIDATE,
    ACTIVE,
    ON_LEAVE,
    TERMINATED;

    public boolean canReceiveCompensationChanges() {
        return this == ACTIVE || this == ON_LEAVE;
    }
}
` },
    { path: `${p}/model/EmploymentType.java`, difficulty: "warmup", topics: ["enums"], code: `package com.codemuscle.hr.model;

public enum EmploymentType {
    FULL_TIME,
    PART_TIME,
    CONTRACT,
    INTERN
}
` },
    { path: `${p}/model/Department.java`, difficulty: "warmup", topics: ["records","immutability","validation"], code: `package com.codemuscle.hr.model;

import java.util.Objects;

public record Department(String id, String code, String name) {
    public Department {
        Objects.requireNonNull(id, "id is required");
        Objects.requireNonNull(code, "code is required");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
    }
}
` },
    { path: `${p}/model/Address.java`, difficulty: "warmup", topics: ["records","validation"], code: `package com.codemuscle.hr.model;

import java.util.Objects;

public record Address(String line1, String city, String countryCode, String postalCode) {
    public Address {
        Objects.requireNonNull(line1, "line1 is required");
        Objects.requireNonNull(city, "city is required");
        Objects.requireNonNull(countryCode, "countryCode is required");
        if (countryCode.length() != 2) {
            throw new IllegalArgumentException("countryCode must be ISO-3166 alpha-2");
        }
    }
}
` },
    { path: `${p}/model/Compensation.java`, difficulty: "intermediate", topics: ["big-decimal","validation","records"], code: `package com.codemuscle.hr.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

public record Compensation(BigDecimal annualSalary, Currency currency) {
    public Compensation {
        Objects.requireNonNull(annualSalary, "annualSalary is required");
        Objects.requireNonNull(currency, "currency is required");
        if (annualSalary.signum() < 0) {
            throw new IllegalArgumentException("annualSalary cannot be negative");
        }
        annualSalary = annualSalary.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal monthly() {
        return annualSalary.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
    }
}
` },
    { path: `${p}/model/Employee.java`, difficulty: "intermediate", topics: ["lombok","collections","date-time","big-decimal"], code: `package com.codemuscle.hr.model;

import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Getter
@Builder(toBuilder = true)
@EqualsAndHashCode(of = "id")
public class Employee {
    private final String id;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final Department department;
    private final EmploymentType employmentType;
    private final EmployeeStatus status;
    private final Compensation compensation;
    private final Address address;
    private final LocalDate joinedOn;
    @Builder.Default
    private final Set<String> skills = new HashSet<>();

    public Set<String> getSkills() {
        return Collections.unmodifiableSet(skills);
    }

    public Employee withStatus(EmployeeStatus next) {
        if (!status.canReceiveCompensationChanges() && next == EmployeeStatus.ACTIVE) {
            throw new IllegalStateException("Cannot reactivate employee from " + status);
        }
        return toBuilder().status(next).build();
    }

    public Employee assignDepartment(Department next) {
        return toBuilder().department(Objects.requireNonNull(next)).build();
    }

    public String fullName() {
        return firstName + " " + lastName;
    }
}
` },
    { path: `${p}/model/LeaveRequest.java`, difficulty: "intermediate", topics: ["records","date-time","validation"], code: `package com.codemuscle.hr.model;

import java.time.LocalDate;
import java.util.Objects;

public record LeaveRequest(String id, String employeeId, LocalDate from, LocalDate to, String reason) {
    public LeaveRequest {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(employeeId, "employeeId");
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to, "to");
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("Leave end date cannot precede start date");
        }
    }

    public long days() {
        return java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
    }
}
` },
    { path: `${p}/dto/EmployeeCreateRequest.java`, difficulty: "warmup", topics: ["validation","records","spring-controller"], code: `package com.codemuscle.hr.dto;

import com.codemuscle.hr.model.EmploymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Set;

public record EmployeeCreateRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank String departmentId,
        @NotNull EmploymentType employmentType,
        @NotNull @DecimalMin("0.00") BigDecimal annualSalary,
        @NotBlank String currencyCode,
        Set<String> skills
) {}
` },
    { path: `${p}/dto/EmployeeResponse.java`, difficulty: "warmup", topics: ["mapping","records"], code: `package com.codemuscle.hr.dto;

import com.codemuscle.hr.model.EmployeeStatus;
import com.codemuscle.hr.model.EmploymentType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public record EmployeeResponse(
        String id,
        String fullName,
        String email,
        String departmentCode,
        EmploymentType employmentType,
        EmployeeStatus status,
        BigDecimal annualSalary,
        String currency,
        LocalDate joinedOn,
        Set<String> skills
) {}
` },
    { path: `${p}/repository/EmployeeRepository.java`, difficulty: "warmup", topics: ["generics","optional","spring-repository"], code: `package com.codemuscle.hr.repository;

import com.codemuscle.hr.model.Employee;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository {
    Employee save(Employee employee);
    Optional<Employee> findById(String id);
    Optional<Employee> findByEmail(String email);
    List<Employee> findAll();
    List<Employee> findByDepartmentId(String departmentId);
    void deleteById(String id);
}
` },
    { path: `${p}/repository/InMemoryEmployeeRepository.java`, difficulty: "advanced", topics: ["concurrency","collections","optional"], code: `package com.codemuscle.hr.repository;

import com.codemuscle.hr.model.Employee;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryEmployeeRepository implements EmployeeRepository {
    private final ConcurrentHashMap<String, Employee> byId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> emailIndex = new ConcurrentHashMap<>();

    @Override
    public Employee save(Employee employee) {
        byId.put(employee.getId(), employee);
        emailIndex.put(employee.getEmail().toLowerCase(Locale.ROOT), employee.getId());
        return employee;
    }

    @Override
    public Optional<Employee> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    @Override
    public Optional<Employee> findByEmail(String email) {
        String id = emailIndex.get(email.toLowerCase(Locale.ROOT));
        return id == null ? Optional.empty() : findById(id);
    }

    @Override
    public List<Employee> findAll() {
        return new ArrayList<>(byId.values());
    }

    @Override
    public void deleteById(String id) {
        Employee removed = byId.remove(id);
        if (removed != null) {
            emailIndex.remove(removed.getEmail().toLowerCase(Locale.ROOT));
        }
    }

    @Override
    public List<Employee> findByDepartmentId(String departmentId) {
        return byId.values().stream()
                .filter(employee -> employee.getDepartment().id().equals(departmentId))
                .toList();
    }
}
` },
    { path: `${p}/repository/DepartmentRepository.java`, difficulty: "warmup", topics: ["optional","collections"], code: `package com.codemuscle.hr.repository;

import com.codemuscle.hr.model.Department;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class DepartmentRepository {
    private final Map<String, Department> departments = new ConcurrentHashMap<>();

    public Department save(Department department) {
        departments.put(department.id(), department);
        return department;
    }

    public Optional<Department> findById(String id) {
        return Optional.ofNullable(departments.get(id));
    }

    public Collection<Department> findAll() {
        return departments.values();
    }
}
` },
    { path: `${p}/mapper/EmployeeMapper.java`, difficulty: "intermediate", topics: ["mapping","lombok","date-time"], code: `package com.codemuscle.hr.mapper;

import com.codemuscle.hr.dto.EmployeeCreateRequest;
import com.codemuscle.hr.dto.EmployeeResponse;
import com.codemuscle.hr.model.Address;
import com.codemuscle.hr.model.Compensation;
import com.codemuscle.hr.model.Department;
import com.codemuscle.hr.model.Employee;
import com.codemuscle.hr.model.EmployeeStatus;
import org.mapstruct.Mapper;
import java.time.LocalDate;
import java.util.Currency;
import java.util.HashSet;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {
    default Employee toModel(EmployeeCreateRequest request, Department department, Address address) {
        return Employee.builder()
                .id(UUID.randomUUID().toString())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .department(department)
                .employmentType(request.employmentType())
                .status(EmployeeStatus.ACTIVE)
                .compensation(new Compensation(request.annualSalary(), Currency.getInstance(request.currencyCode())))
                .address(address)
                .joinedOn(LocalDate.now())
                .skills(request.skills() == null ? new HashSet<>() : new HashSet<>(request.skills()))
                .build();
    }

    default EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.fullName(),
                employee.getEmail(),
                employee.getDepartment().code(),
                employee.getEmploymentType(),
                employee.getStatus(),
                employee.getCompensation().annualSalary(),
                employee.getCompensation().currency().getCurrencyCode(),
                employee.getJoinedOn(),
                employee.getSkills()
        );
    }
}
` },
    { path: `${p}/exception/EmployeeNotFoundException.java`, difficulty: "warmup", topics: ["exception-handling"], code: `package com.codemuscle.hr.exception;

public class EmployeeNotFoundException extends RuntimeException {
    public EmployeeNotFoundException(String id) {
        super("Employee not found: " + id);
    }
}
` },
    { path: `${p}/exception/GlobalExceptionHandler.java`, difficulty: "intermediate", topics: ["exception-handling","spring-controller"], code: `package com.codemuscle.hr.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EmployeeNotFoundException.class)
    ProblemDetail missing(EmployeeNotFoundException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    ProblemDetail badRequest(RuntimeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalid(MethodArgumentNotValidException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed");
    }
}
` },
    { path: `${p}/service/EmployeeService.java`, difficulty: "warmup", topics: ["service-layer","generics"], code: `package com.codemuscle.hr.service;

import com.codemuscle.hr.dto.EmployeeCreateRequest;
import com.codemuscle.hr.dto.EmployeeResponse;
import com.codemuscle.hr.model.LeaveRequest;
import java.util.List;
import java.util.Map;

public interface EmployeeService {
    EmployeeResponse create(EmployeeCreateRequest request);
    EmployeeResponse find(String id);
    List<EmployeeResponse> search(String query);
    EmployeeResponse replace(String id, EmployeeCreateRequest request);
    EmployeeResponse changeStatus(String id, com.codemuscle.hr.model.EmployeeStatus status);
    void delete(String id);
    Map<String, Long> countByDepartment();
    LeaveRequest requestLeave(LeaveRequest request);
}
` },
    { path: `${p}/service/impl/EmployeeServiceImpl.java`, difficulty: "advanced", topics: ["service-layer","streams","collections","transactions","big-decimal"], code: `package com.codemuscle.hr.service.impl;

import com.codemuscle.hr.dto.EmployeeCreateRequest;
import com.codemuscle.hr.dto.EmployeeResponse;
import com.codemuscle.hr.exception.EmployeeNotFoundException;
import com.codemuscle.hr.mapper.EmployeeMapper;
import com.codemuscle.hr.model.Address;
import com.codemuscle.hr.model.Employee;
import com.codemuscle.hr.model.EmployeeStatus;
import com.codemuscle.hr.model.LeaveRequest;
import com.codemuscle.hr.repository.DepartmentRepository;
import com.codemuscle.hr.repository.EmployeeRepository;
import com.codemuscle.hr.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
    private static final BigDecimal MIN_SALARY = new BigDecimal("20000.00");

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeMapper mapper;

    @Override
    public EmployeeResponse create(EmployeeCreateRequest request) {
        if (request.annualSalary().compareTo(MIN_SALARY) < 0) {
            throw new IllegalArgumentException("Salary below company minimum");
        }
        employeeRepository.findByEmail(request.email()).ifPresent(existing -> {
            throw new IllegalStateException("Email already registered: " + existing.getEmail());
        });
        var department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown department"));
        var address = new Address("Pending", "Pending", "US", "00000");
        Employee saved = employeeRepository.save(mapper.toModel(request, department, address));
        log.info("Created employee {}", saved.getId());
        return mapper.toResponse(saved);
    }

    @Override
    public EmployeeResponse find(String id) {
        return employeeRepository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
    }

    @Override
    public List<EmployeeResponse> search(String query) {
        String term = query == null ? "" : query.toLowerCase(Locale.ROOT);
        return employeeRepository.findAll().stream()
                .filter(employee -> employee.fullName().toLowerCase(Locale.ROOT).contains(term)
                        || employee.getEmail().toLowerCase(Locale.ROOT).contains(term))
                .sorted(Comparator.comparing(Employee::getJoinedOn).reversed())
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public EmployeeResponse replace(String id, EmployeeCreateRequest request) {
        Employee current = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
        var department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown department"));
        Employee replacement = mapper.toModel(request, department, current.getAddress())
                .toBuilder().id(id).joinedOn(current.getJoinedOn()).build();
        return mapper.toResponse(employeeRepository.save(replacement));
    }

    @Override
    public EmployeeResponse changeStatus(String id, EmployeeStatus status) {
        Employee current = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));
        return mapper.toResponse(employeeRepository.save(current.withStatus(status)));
    }

    @Override
    public void delete(String id) {
        employeeRepository.findById(id).orElseThrow(() -> new EmployeeNotFoundException(id));
        employeeRepository.deleteById(id);
    }

    @Override
    public Map<String, Long> countByDepartment() {
        return employeeRepository.findAll().stream()
                .filter(employee -> employee.getStatus() == EmployeeStatus.ACTIVE)
                .collect(Collectors.groupingBy(employee -> employee.getDepartment().code(), Collectors.counting()));
    }

    @Override
    public LeaveRequest requestLeave(LeaveRequest request) {
        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new EmployeeNotFoundException(request.employeeId()));
        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new IllegalStateException("Only active employees can request leave");
        }
        employeeRepository.save(employee.withStatus(EmployeeStatus.ON_LEAVE));
        return request;
    }
}
` },
    { path: `${p}/controller/EmployeeController.java`, difficulty: "intermediate", topics: ["spring-controller","validation","dependency-injection"], code: `package com.codemuscle.hr.controller;

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
` },
    { path: `${p}/util/EmployeeStatistics.java`, difficulty: "advanced", topics: ["streams","collections","big-decimal"], code: `package com.codemuscle.hr.util;

import com.codemuscle.hr.model.Employee;
import com.codemuscle.hr.model.EmployeeStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class EmployeeStatistics {
    private EmployeeStatistics() {}

    public static BigDecimal averageSalary(Collection<Employee> employees) {
        List<BigDecimal> salaries = employees.stream()
                .filter(employee -> employee.getStatus() == EmployeeStatus.ACTIVE)
                .map(employee -> employee.getCompensation().annualSalary())
                .toList();
        if (salaries.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal total = salaries.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(salaries.size()), 2, RoundingMode.HALF_UP);
    }

    public static Map<EmployeeStatus, Long> statusHistogram(Collection<Employee> employees) {
        return employees.stream().collect(Collectors.groupingBy(
                Employee::getStatus,
                () -> new EnumMap<>(EmployeeStatus.class),
                Collectors.counting()
        ));
    }

    public static List<Employee> topEarners(Collection<Employee> employees, int limit) {
        return employees.stream()
                .sorted(Comparator.comparing((Employee e) -> e.getCompensation().annualSalary()).reversed())
                .limit(limit)
                .toList();
    }
}
` },
    { path: `${p}/config/HrConfiguration.java`, difficulty: "warmup", topics: ["spring-configuration"], code: `package com.codemuscle.hr.config;

import com.codemuscle.hr.model.Department;
import com.codemuscle.hr.repository.DepartmentRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
public class HrConfiguration {
    @Bean
    ApplicationRunner seedDepartments(DepartmentRepository departmentRepository) {
        return args -> List.of(
                new Department("d-eng", "ENG", "Engineering"),
                new Department("d-hr", "HR", "Human Resources"),
                new Department("d-fin", "FIN", "Finance")
        ).forEach(departmentRepository::save);
    }
}
` }
  ];
  writeManifest("employee-hr-system", {
    name: "Employee HR Management System",
    description: "Practise Spring Boot HR workflows: workforce indexing, salary validation, leave, streams, and department statistics.",
    difficulty: "intermediate",
    order: 1,
    test: {
      path: "src/test/java/com/codemuscle/hr/util/EmployeeStatisticsTest.java",
      code: `package com.codemuscle.hr.util;

import com.codemuscle.hr.model.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Currency;
import java.util.List;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.assertEquals;

class EmployeeStatisticsTest {
    @Test
    void averagesActiveSalaries() {
        Department eng = new Department("1", "ENG", "Engineering");
        Employee a = Employee.builder().id("a").firstName("Ada").lastName("Lovelace").email("a@x.com")
                .department(eng).employmentType(EmploymentType.FULL_TIME).status(EmployeeStatus.ACTIVE)
                .compensation(new Compensation(new BigDecimal("120000.00"), Currency.getInstance("USD")))
                .address(new Address("1 Main", "London", "GB", "E1")).joinedOn(LocalDate.now()).skills(Set.of("java")).build();
        Employee b = Employee.builder().id("b").firstName("Grace").lastName("Hopper").email("g@x.com")
                .department(eng).employmentType(EmploymentType.FULL_TIME).status(EmployeeStatus.ACTIVE)
                .compensation(new Compensation(new BigDecimal("80000.00"), Currency.getInstance("USD")))
                .address(new Address("2 Main", "London", "GB", "E1")).joinedOn(LocalDate.now()).skills(Set.of("cobol")).build();
        assertEquals(new BigDecimal("100000.00"), EmployeeStatistics.averageSalary(List.of(a, b)));
    }
}
`
    }
  }, files);
}

// ─── 2. Logistics ─────────────────────────────────────────────────────────────
{
  const p = "src/main/java/com/codemuscle/logistics";
  const files = [
    { path: `${p}/LogisticsApplication.java`, difficulty: "warmup", topics: ["spring-boot"], code: `package com.codemuscle.logistics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LogisticsApplication {
    public static void main(String[] args) {
        SpringApplication.run(LogisticsApplication.class, args);
    }
}
` },
    { path: `${p}/model/ShipmentStatus.java`, difficulty: "warmup", topics: ["enums"], code: `package com.codemuscle.logistics.model;

public enum ShipmentStatus {
    CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED;

    public boolean canTransitionTo(ShipmentStatus next) {
        return switch (this) {
            case CREATED -> next == PICKED_UP || next == CANCELLED;
            case PICKED_UP -> next == IN_TRANSIT || next == CANCELLED;
            case IN_TRANSIT -> next == OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> next == DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
` },
    { path: `${p}/model/DeliveryPriority.java`, difficulty: "warmup", topics: ["enums"], code: `package com.codemuscle.logistics.model;

public enum DeliveryPriority {
    STANDARD(1), EXPRESS(2), SAME_DAY(3);

    private final int weight;

    DeliveryPriority(int weight) {
        this.weight = weight;
    }

    public int weight() {
        return weight;
    }
}
` },
    { path: `${p}/model/PackageItem.java`, difficulty: "warmup", topics: ["records","validation"], code: `package com.codemuscle.logistics.model;

import java.math.BigDecimal;
import java.util.Objects;

public record PackageItem(String sku, int quantity, BigDecimal weightKg) {
    public PackageItem {
        Objects.requireNonNull(sku, "sku");
        Objects.requireNonNull(weightKg, "weightKg");
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive");
        if (weightKg.signum() <= 0) throw new IllegalArgumentException("weight must be positive");
    }

    public BigDecimal totalWeight() {
        return weightKg.multiply(BigDecimal.valueOf(quantity));
    }
}
` },
    { path: `${p}/model/Warehouse.java`, difficulty: "intermediate", topics: ["lombok","validation"], code: `package com.codemuscle.logistics.model;

import lombok.Builder;
import lombok.Getter;
import java.util.Objects;

@Getter
@Builder
public class Warehouse {
    private final String id;
    private final String code;
    private final int capacityUnits;
    private int occupiedUnits;

    public synchronized boolean reserve(int units) {
        if (occupiedUnits + units > capacityUnits) {
            return false;
        }
        occupiedUnits += units;
        return true;
    }

    public int remainingCapacity() {
        return capacityUnits - occupiedUnits;
    }
}
` },
    { path: `${p}/model/TrackingEvent.java`, difficulty: "warmup", topics: ["records","date-time"], code: `package com.codemuscle.logistics.model;

import java.time.Instant;
import java.util.Objects;

public record TrackingEvent(Instant occurredAt, ShipmentStatus status, String locationCode, String note) {
    public TrackingEvent {
        Objects.requireNonNull(occurredAt, "occurredAt");
        Objects.requireNonNull(status, "status");
        Objects.requireNonNull(locationCode, "locationCode");
    }
}
` },
    { path: `${p}/model/Shipment.java`, difficulty: "advanced", topics: ["lombok","collections","date-time"], code: `package com.codemuscle.logistics.model;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Getter
@Builder(toBuilder = true)
public class Shipment {
    private final String id;
    private final String trackingNumber;
    private final String warehouseId;
    private final DeliveryPriority priority;
    private final List<PackageItem> items;
    @Builder.Default
    private final List<TrackingEvent> events = new ArrayList<>();
    private final ShipmentStatus status;
    private final Instant createdAt;

    public List<TrackingEvent> getEvents() {
        return Collections.unmodifiableList(events);
    }

    public int totalUnits() {
        return items.stream().mapToInt(PackageItem::quantity).sum();
    }

    public Shipment transition(ShipmentStatus next, String location, String note) {
        if (!status.canTransitionTo(next)) {
            throw new IllegalStateException("Illegal transition " + status + " -> " + next);
        }
        List<TrackingEvent> updated = new ArrayList<>(events);
        updated.add(new TrackingEvent(Instant.now(), next, location, note));
        return toBuilder().status(next).events(updated).build();
    }
}
` },
    { path: `${p}/dto/ShipmentCreateRequest.java`, difficulty: "warmup", topics: ["validation","records"], code: `package com.codemuscle.logistics.dto;

import com.codemuscle.logistics.model.DeliveryPriority;
import com.codemuscle.logistics.model.PackageItem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ShipmentCreateRequest(
        @NotBlank String warehouseId,
        @NotNull DeliveryPriority priority,
        @NotEmpty @Valid List<PackageItem> items
) {}
` },
    { path: `${p}/dto/ShipmentResponse.java`, difficulty: "warmup", topics: ["mapping","records"], code: `package com.codemuscle.logistics.dto;

import com.codemuscle.logistics.model.DeliveryPriority;
import com.codemuscle.logistics.model.ShipmentStatus;
import com.codemuscle.logistics.model.TrackingEvent;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ShipmentResponse(
        String id,
        String trackingNumber,
        ShipmentStatus status,
        DeliveryPriority priority,
        BigDecimal estimatedCost,
        Instant createdAt,
        List<TrackingEvent> events
) {}
` },
    { path: `${p}/strategy/ShippingCostStrategy.java`, difficulty: "advanced", topics: ["strategy-pattern","functional-interfaces","big-decimal"], code: `package com.codemuscle.logistics.strategy;

import com.codemuscle.logistics.model.DeliveryPriority;
import com.codemuscle.logistics.model.PackageItem;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@FunctionalInterface
public interface ShippingCostStrategy {
    BigDecimal calculate(List<PackageItem> items, DeliveryPriority priority);

    static ShippingCostStrategy weightBased() {
        return (items, priority) -> {
            BigDecimal weight = items.stream()
                    .map(PackageItem::totalWeight)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal base = weight.multiply(new BigDecimal("1.75"));
            BigDecimal multiplier = switch (priority) {
                case STANDARD -> BigDecimal.ONE;
                case EXPRESS -> new BigDecimal("1.35");
                case SAME_DAY -> new BigDecimal("1.85");
            };
            return base.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        };
    }
}
` },
    { path: `${p}/repository/ShipmentRepository.java`, difficulty: "advanced", topics: ["concurrency","collections"], code: `package com.codemuscle.logistics.repository;

import com.codemuscle.logistics.model.Shipment;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class ShipmentRepository {
    private final ConcurrentHashMap<String, Shipment> byId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> trackingIndex = new ConcurrentHashMap<>();

    public Shipment save(Shipment shipment) {
        byId.put(shipment.getId(), shipment);
        trackingIndex.put(shipment.getTrackingNumber(), shipment.getId());
        return shipment;
    }

    public Optional<Shipment> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    public Optional<Shipment> findByTrackingNumber(String trackingNumber) {
        return Optional.ofNullable(trackingIndex.get(trackingNumber)).flatMap(this::findById);
    }

    public List<Shipment> findAll() {
        return new ArrayList<>(byId.values());
    }

    public Shipment compute(String id, java.util.function.UnaryOperator<Shipment> updater) {
        return byId.computeIfPresent(id, (key, current) -> updater.apply(current));
    }
}
` },
    { path: `${p}/repository/WarehouseRepository.java`, difficulty: "intermediate", topics: ["collections"], code: `package com.codemuscle.logistics.repository;

import com.codemuscle.logistics.model.Warehouse;
import org.springframework.stereotype.Repository;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class WarehouseRepository {
    private final Map<String, Warehouse> warehouses = new ConcurrentHashMap<>();
    private final Set<String> codes = ConcurrentHashMap.newKeySet();

    public Warehouse save(Warehouse warehouse) {
        if (!codes.add(warehouse.getCode()) && !warehouses.containsKey(warehouse.getId())) {
            throw new IllegalStateException("Duplicate warehouse code");
        }
        warehouses.put(warehouse.getId(), warehouse);
        return warehouse;
    }

    public Optional<Warehouse> findById(String id) {
        return Optional.ofNullable(warehouses.get(id));
    }

    public Set<String> knownCodes() {
        return new HashSet<>(codes);
    }
}
` },
    { path: `${p}/service/ShipmentService.java`, difficulty: "warmup", topics: ["service-layer"], code: `package com.codemuscle.logistics.service;

import com.codemuscle.logistics.dto.ShipmentCreateRequest;
import com.codemuscle.logistics.dto.ShipmentResponse;
import com.codemuscle.logistics.model.ShipmentStatus;
import java.util.List;

public interface ShipmentService {
    ShipmentResponse create(ShipmentCreateRequest request);
    ShipmentResponse track(String trackingNumber);
    ShipmentResponse advance(String id, ShipmentStatus next, String location, String note);
    List<ShipmentResponse> prioritizedQueue();
}
` },
    { path: `${p}/service/impl/ShipmentServiceImpl.java`, difficulty: "advanced", topics: ["service-layer","streams","concurrency","strategy-pattern"], code: `package com.codemuscle.logistics.service.impl;

import com.codemuscle.logistics.dto.ShipmentCreateRequest;
import com.codemuscle.logistics.dto.ShipmentResponse;
import com.codemuscle.logistics.model.Shipment;
import com.codemuscle.logistics.model.ShipmentStatus;
import com.codemuscle.logistics.model.TrackingEvent;
import com.codemuscle.logistics.repository.ShipmentRepository;
import com.codemuscle.logistics.repository.WarehouseRepository;
import com.codemuscle.logistics.service.ShipmentService;
import com.codemuscle.logistics.strategy.ShippingCostStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {
    private final ShipmentRepository shipmentRepository;
    private final WarehouseRepository warehouseRepository;
    private final ShippingCostStrategy costStrategy;

    @Override
    public ShipmentResponse create(ShipmentCreateRequest request) {
        var warehouse = warehouseRepository.findById(request.warehouseId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown warehouse"));
        int units = request.items().stream().mapToInt(item -> item.quantity()).sum();
        if (!warehouse.reserve(units)) {
            throw new IllegalStateException("Warehouse capacity exceeded");
        }
        String tracking = "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Shipment shipment = Shipment.builder()
                .id(UUID.randomUUID().toString())
                .trackingNumber(tracking)
                .warehouseId(warehouse.getId())
                .priority(request.priority())
                .items(List.copyOf(request.items()))
                .status(ShipmentStatus.CREATED)
                .createdAt(Instant.now())
                .events(List.of(new TrackingEvent(Instant.now(), ShipmentStatus.CREATED, warehouse.getCode(), "Created")))
                .build();
        return toResponse(shipmentRepository.save(shipment));
    }

    @Override
    public ShipmentResponse track(String trackingNumber) {
        return shipmentRepository.findByTrackingNumber(trackingNumber)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Unknown tracking number"));
    }

    @Override
    public ShipmentResponse advance(String id, ShipmentStatus next, String location, String note) {
        Shipment updated = shipmentRepository.compute(id, current -> current.transition(next, location, note));
        if (updated == null) {
            throw new IllegalArgumentException("Shipment not found: " + id);
        }
        return toResponse(updated);
    }

    @Override
    public List<ShipmentResponse> prioritizedQueue() {
        return shipmentRepository.findAll().stream()
                .filter(shipment -> shipment.getStatus() != ShipmentStatus.DELIVERED
                        && shipment.getStatus() != ShipmentStatus.CANCELLED)
                .sorted(Comparator.comparingInt((Shipment s) -> s.getPriority().weight()).reversed()
                        .thenComparing(Shipment::getCreatedAt))
                .map(this::toResponse)
                .toList();
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        return new ShipmentResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                shipment.getStatus(),
                shipment.getPriority(),
                costStrategy.calculate(shipment.getItems(), shipment.getPriority()),
                shipment.getCreatedAt(),
                shipment.getEvents()
        );
    }
}
` },
    { path: `${p}/mapper/ShipmentMapper.java`, difficulty: "intermediate", topics: ["mapping","mapstruct"], code: `package com.codemuscle.logistics.mapper;

import com.codemuscle.logistics.dto.ShipmentResponse;
import com.codemuscle.logistics.model.Shipment;
import org.mapstruct.Mapper;
import java.math.BigDecimal;

@Mapper(componentModel = "spring")
public interface ShipmentMapper {
    ShipmentResponse toResponse(Shipment shipment, BigDecimal shippingCost);
}
` },
    { path: `${p}/controller/ShipmentController.java`, difficulty: "intermediate", topics: ["spring-controller","validation"], code: `package com.codemuscle.logistics.controller;

import com.codemuscle.logistics.dto.ShipmentCreateRequest;
import com.codemuscle.logistics.dto.ShipmentResponse;
import com.codemuscle.logistics.model.ShipmentStatus;
import com.codemuscle.logistics.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {
    private final ShipmentService shipmentService;

    @PostMapping
    public ResponseEntity<ShipmentResponse> create(@Valid @RequestBody ShipmentCreateRequest request) {
        ShipmentResponse response = shipmentService.create(request);
        return ResponseEntity.created(URI.create("/api/shipments/" + response.id())).body(response);
    }

    @GetMapping("/track/{trackingNumber}")
    public ShipmentResponse track(@PathVariable String trackingNumber) {
        return shipmentService.track(trackingNumber);
    }

    @PostMapping("/{id}/advance")
    public ShipmentResponse advance(@PathVariable String id, @RequestBody Map<String, String> body) {
        return shipmentService.advance(
                id,
                ShipmentStatus.valueOf(body.get("status")),
                body.getOrDefault("location", "UNKNOWN"),
                body.getOrDefault("note", "")
        );
    }

    @PutMapping("/{id}/status")
    public ShipmentResponse replaceStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return shipmentService.advance(id, ShipmentStatus.valueOf(body.get("status")),
                body.getOrDefault("location", "UNKNOWN"), body.getOrDefault("note", "Status replaced"));
    }

    @PatchMapping("/{id}/status")
    public ShipmentResponse patchStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return shipmentService.advance(id, ShipmentStatus.valueOf(body.get("status")),
                body.getOrDefault("location", "UNKNOWN"), body.getOrDefault("note", "Status patched"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable String id) {
        shipmentService.advance(id, ShipmentStatus.CANCELLED, "SYSTEM", "Shipment cancelled");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/queue")
    public List<ShipmentResponse> queue() {
        return shipmentService.prioritizedQueue();
    }
}
` },
    { path: `${p}/exception/GlobalExceptionHandler.java`, difficulty: "intermediate", topics: ["exception-handling"], code: `package com.codemuscle.logistics.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    ProblemDetail badRequest(RuntimeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
}
` },
    { path: `${p}/config/LogisticsConfiguration.java`, difficulty: "warmup", topics: ["spring-configuration","strategy-pattern"], code: `package com.codemuscle.logistics.config;

import com.codemuscle.logistics.model.Warehouse;
import com.codemuscle.logistics.repository.WarehouseRepository;
import com.codemuscle.logistics.strategy.ShippingCostStrategy;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LogisticsConfiguration {
    @Bean
    ShippingCostStrategy shippingCostStrategy() {
        return ShippingCostStrategy.weightBased();
    }

    @Bean
    ApplicationRunner seedWarehouses(WarehouseRepository warehouseRepository) {
        return args -> warehouseRepository.save(Warehouse.builder()
                .id("wh-1").code("AMS-01").capacityUnits(10_000).occupiedUnits(0).build());
    }
}
` },
    { path: `${p}/util/ShipmentAggregator.java`, difficulty: "advanced", topics: ["streams","collections"], code: `package com.codemuscle.logistics.util;

import com.codemuscle.logistics.model.Shipment;
import com.codemuscle.logistics.model.ShipmentStatus;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class ShipmentAggregator {
    private ShipmentAggregator() {}

    public static Map<ShipmentStatus, List<Shipment>> groupByStatus(Collection<Shipment> shipments) {
        return shipments.stream().collect(Collectors.groupingBy(Shipment::getStatus));
    }

    public static Map<Boolean, List<Shipment>> partitionDelivered(Collection<Shipment> shipments) {
        return shipments.stream().collect(Collectors.partitioningBy(s -> s.getStatus() == ShipmentStatus.DELIVERED));
    }

    public static Map<String, Long> countByWarehouse(Collection<Shipment> shipments) {
        return shipments.stream().collect(Collectors.groupingBy(Shipment::getWarehouseId, Collectors.counting()));
    }
}
` }
  ];
  writeManifest("logistics-system", {
    name: "Logistics and Shipment Management System",
    description: "Practise shipment routing, capacity checks, tracking indexes, priority queues, and shipping-cost strategies.",
    difficulty: "intermediate",
    order: 2,
    test: {
      path: "src/test/java/com/codemuscle/logistics/strategy/ShippingCostStrategyTest.java",
      code: `package com.codemuscle.logistics.strategy;

import com.codemuscle.logistics.model.DeliveryPriority;
import com.codemuscle.logistics.model.PackageItem;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShippingCostStrategyTest {
    @Test
    void expressCostsMoreThanStandard() {
        var items = List.of(new PackageItem("SKU-1", 2, new BigDecimal("1.5")));
        var strategy = ShippingCostStrategy.weightBased();
        assertTrue(strategy.calculate(items, DeliveryPriority.EXPRESS)
                .compareTo(strategy.calculate(items, DeliveryPriority.STANDARD)) > 0);
    }
}
`
    }
  }, files);
}

// ─── 3. Energy billing ────────────────────────────────────────────────────────
{
  const p = "src/main/java/com/codemuscle/energy";
  const files = [
    { path: `${p}/EnergyApplication.java`, difficulty: "warmup", topics: ["spring-boot"], code: `package com.codemuscle.energy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EnergyApplication {
    public static void main(String[] args) {
        SpringApplication.run(EnergyApplication.class, args);
    }
}
` },
    { path: `${p}/model/BillingStatus.java`, difficulty: "warmup", topics: ["enums"], code: `package com.codemuscle.energy.model;

public enum BillingStatus {
    DRAFT, ISSUED, PAID, OVERDUE, VOIDED
}
` },
    { path: `${p}/model/GridArea.java`, difficulty: "warmup", topics: ["records"], code: `package com.codemuscle.energy.model;

import java.util.Objects;

public record GridArea(String code, String timeZone) {
    public GridArea {
        Objects.requireNonNull(code, "code");
        Objects.requireNonNull(timeZone, "timeZone");
    }
}
` },
    { path: `${p}/model/Customer.java`, difficulty: "warmup", topics: ["records","validation"], code: `package com.codemuscle.energy.model;

import java.util.Objects;

public record Customer(String id, String accountNumber, String displayName, GridArea gridArea) {
    public Customer {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(accountNumber, "accountNumber");
        Objects.requireNonNull(gridArea, "gridArea");
    }
}
` },
    { path: `${p}/model/Meter.java`, difficulty: "intermediate", topics: ["lombok"], code: `package com.codemuscle.energy.model;

import lombok.Builder;
import lombok.Getter;
import java.util.Objects;

@Getter
@Builder
public class Meter {
    private final String id;
    private final String serialNumber;
    private final String customerId;
    private final boolean active;
}
` },
    { path: `${p}/model/MeterReading.java`, difficulty: "intermediate", topics: ["records","big-decimal","date-time"], code: `package com.codemuscle.energy.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

public record MeterReading(String meterId, Instant recordedAt, BigDecimal kilowattHours) {
    public MeterReading {
        Objects.requireNonNull(meterId, "meterId");
        Objects.requireNonNull(recordedAt, "recordedAt");
        Objects.requireNonNull(kilowattHours, "kilowattHours");
        if (kilowattHours.signum() < 0) {
            throw new IllegalArgumentException("Reading cannot be negative");
        }
    }

    public String dedupeKey() {
        return meterId + "|" + recordedAt.toEpochMilli();
    }
}
` },
    { path: `${p}/model/Tariff.java`, difficulty: "intermediate", topics: ["records","big-decimal"], code: `package com.codemuscle.energy.model;

import java.math.BigDecimal;
import java.util.Objects;

public record Tariff(String code, BigDecimal pricePerKwh, BigDecimal standingChargeDaily) {
    public Tariff {
        Objects.requireNonNull(code, "code");
        Objects.requireNonNull(pricePerKwh, "pricePerKwh");
        Objects.requireNonNull(standingChargeDaily, "standingChargeDaily");
        if (pricePerKwh.signum() < 0 || standingChargeDaily.signum() < 0) {
            throw new IllegalArgumentException("Tariff amounts cannot be negative");
        }
    }
}
` },
    { path: `${p}/model/Invoice.java`, difficulty: "intermediate", topics: ["lombok","big-decimal","date-time"], code: `package com.codemuscle.energy.model;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Builder
public class Invoice {
    private final String id;
    private final String customerId;
    private final LocalDate periodStart;
    private final LocalDate periodEnd;
    private final BigDecimal consumptionKwh;
    private final BigDecimal amountDue;
    private final BillingStatus status;
}
` },
    { path: `${p}/strategy/TariffCalculationStrategy.java`, difficulty: "advanced", topics: ["strategy-pattern","big-decimal"], code: `package com.codemuscle.energy.strategy;

import com.codemuscle.energy.model.Tariff;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.time.LocalDate;

@FunctionalInterface
public interface TariffCalculationStrategy {
    BigDecimal calculate(Tariff tariff, BigDecimal consumptionKwh, LocalDate from, LocalDate to);

    static TariffCalculationStrategy standard() {
        return (tariff, consumption, from, to) -> {
            long days = ChronoUnit.DAYS.between(from, to) + 1;
            BigDecimal energy = consumption.multiply(tariff.pricePerKwh());
            BigDecimal standing = tariff.standingChargeDaily().multiply(BigDecimal.valueOf(days));
            return energy.add(standing).setScale(2, RoundingMode.HALF_UP);
        };
    }
}
` },
    { path: `${p}/repository/MeterReadingRepository.java`, difficulty: "advanced", topics: ["collections","concurrency"], code: `package com.codemuscle.energy.repository;

import com.codemuscle.energy.model.MeterReading;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class MeterReadingRepository {
    private final Map<String, List<MeterReading>> byMeter = new ConcurrentHashMap<>();
    private final Set<String> seenKeys = ConcurrentHashMap.newKeySet();

    public MeterReading save(MeterReading reading) {
        if (!seenKeys.add(reading.dedupeKey())) {
            throw new IllegalStateException("Duplicate meter reading");
        }
        byMeter.computeIfAbsent(reading.meterId(), key -> new ArrayList<>()).add(reading);
        return reading;
    }

    public List<MeterReading> findByMeter(String meterId) {
        return List.copyOf(byMeter.getOrDefault(meterId, List.of()));
    }

    public Set<String> duplicateCandidates() {
        return new HashSet<>(seenKeys);
    }

    public void deleteByMeter(String meterId) {
        List<MeterReading> removed = byMeter.remove(meterId);
        if (removed != null) {
            removed.forEach(reading -> seenKeys.remove(reading.dedupeKey()));
        }
    }
}
` },
    { path: `${p}/repository/TariffRepository.java`, difficulty: "warmup", topics: ["collections"], code: `package com.codemuscle.energy.repository;

import com.codemuscle.energy.model.Tariff;
import org.springframework.stereotype.Repository;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Repository
public class TariffRepository {
    private final Map<String, Tariff> tariffs = new HashMap<>();

    public void put(Tariff tariff) {
        tariffs.put(tariff.code(), tariff);
    }

    public Optional<Tariff> find(String code) {
        return Optional.ofNullable(tariffs.get(code));
    }
}
` },
    { path: `${p}/service/BillingService.java`, difficulty: "warmup", topics: ["service-layer"], code: `package com.codemuscle.energy.service;

import com.codemuscle.energy.dto.InvoiceResponse;
import com.codemuscle.energy.dto.ReadingIngestRequest;
import com.codemuscle.energy.model.MeterReading;
import java.time.LocalDate;
import java.util.List;

public interface BillingService {
    MeterReading ingest(ReadingIngestRequest request);
    InvoiceResponse generateInvoice(String customerId, String meterId, String tariffCode, LocalDate from, LocalDate to);
    List<MeterReading> missingGaps(String meterId, LocalDate from, LocalDate to);
    void deleteReadings(String meterId);
}
` },
    { path: `${p}/dto/ReadingIngestRequest.java`, difficulty: "warmup", topics: ["validation","records"], code: `package com.codemuscle.energy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public record ReadingIngestRequest(
        @NotBlank String meterId,
        @NotNull Instant recordedAt,
        @NotNull @DecimalMin("0.000") BigDecimal kilowattHours
) {}
` },
    { path: `${p}/dto/InvoiceResponse.java`, difficulty: "warmup", topics: ["mapping","big-decimal"], code: `package com.codemuscle.energy.dto;

import com.codemuscle.energy.model.BillingStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceResponse(
        String id,
        String customerId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal consumptionKwh,
        BigDecimal amountDue,
        BillingStatus status
) {}
` },
    { path: `${p}/service/impl/BillingServiceImpl.java`, difficulty: "advanced", topics: ["service-layer","big-decimal","date-time","streams"], code: `package com.codemuscle.energy.service.impl;

import com.codemuscle.energy.dto.InvoiceResponse;
import com.codemuscle.energy.dto.ReadingIngestRequest;
import com.codemuscle.energy.model.BillingStatus;
import com.codemuscle.energy.model.Invoice;
import com.codemuscle.energy.model.MeterReading;
import com.codemuscle.energy.repository.MeterReadingRepository;
import com.codemuscle.energy.repository.TariffRepository;
import com.codemuscle.energy.service.BillingService;
import com.codemuscle.energy.strategy.TariffCalculationStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {
    private final MeterReadingRepository readingRepository;
    private final TariffRepository tariffRepository;
    private final TariffCalculationStrategy calculationStrategy;

    @Override
    public MeterReading ingest(ReadingIngestRequest request) {
        return readingRepository.save(new MeterReading(request.meterId(), request.recordedAt(), request.kilowattHours()));
    }

    @Override
    public InvoiceResponse generateInvoice(String customerId, String meterId, String tariffCode, LocalDate from, LocalDate to) {
        var tariff = tariffRepository.find(tariffCode).orElseThrow(() -> new IllegalArgumentException("Unknown tariff"));
        List<MeterReading> readings = readingRepository.findByMeter(meterId).stream()
                .filter(reading -> {
                    LocalDate day = LocalDate.ofInstant(reading.recordedAt(), ZoneOffset.UTC);
                    return !day.isBefore(from) && !day.isAfter(to);
                })
                .sorted(Comparator.comparing(MeterReading::recordedAt))
                .toList();
        BigDecimal consumption = readings.stream()
                .map(MeterReading::kilowattHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal amount = calculationStrategy.calculate(tariff, consumption, from, to);
        Invoice invoice = Invoice.builder()
                .id(UUID.randomUUID().toString())
                .customerId(customerId)
                .periodStart(from)
                .periodEnd(to)
                .consumptionKwh(consumption)
                .amountDue(amount)
                .status(BillingStatus.ISSUED)
                .build();
        return new InvoiceResponse(invoice.getId(), invoice.getCustomerId(), invoice.getPeriodStart(),
                invoice.getPeriodEnd(), invoice.getConsumptionKwh(), invoice.getAmountDue(), invoice.getStatus());
    }

    @Override
    public List<MeterReading> missingGaps(String meterId, LocalDate from, LocalDate to) {
        var present = readingRepository.findByMeter(meterId).stream()
                .map(reading -> LocalDate.ofInstant(reading.recordedAt(), ZoneOffset.UTC))
                .collect(java.util.stream.Collectors.toSet());
        List<MeterReading> missing = new ArrayList<>();
        for (LocalDate cursor = from; !cursor.isAfter(to); cursor = cursor.plusDays(1)) {
            if (!present.contains(cursor)) {
                missing.add(new MeterReading(meterId, cursor.atStartOfDay().toInstant(ZoneOffset.UTC), BigDecimal.ZERO));
            }
        }
        return missing;
    }

    @Override
    public void deleteReadings(String meterId) {
        readingRepository.deleteByMeter(meterId);
    }
}
` },
    { path: `${p}/mapper/BillingMapper.java`, difficulty: "intermediate", topics: ["mapping","mapstruct","big-decimal"], code: `package com.codemuscle.energy.mapper;

import com.codemuscle.energy.dto.InvoiceResponse;
import com.codemuscle.energy.model.Invoice;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BillingMapper {
    InvoiceResponse toResponse(Invoice invoice);
}
` },
    { path: `${p}/controller/BillingController.java`, difficulty: "intermediate", topics: ["spring-controller","validation"], code: `package com.codemuscle.energy.controller;

import com.codemuscle.energy.dto.InvoiceResponse;
import com.codemuscle.energy.dto.ReadingIngestRequest;
import com.codemuscle.energy.model.MeterReading;
import com.codemuscle.energy.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {
    private final BillingService billingService;

    @PostMapping("/readings")
    public ResponseEntity<MeterReading> ingest(@Valid @RequestBody ReadingIngestRequest request) {
        return ResponseEntity.accepted().body(billingService.ingest(request));
    }

    @PutMapping("/readings/{meterId}")
    public MeterReading replaceReading(@PathVariable String meterId,
                                       @Valid @RequestBody ReadingIngestRequest request) {
        return billingService.ingest(new ReadingIngestRequest(
                meterId, request.recordedAt(), request.kilowattHours()));
    }

    @PatchMapping("/readings/{meterId}")
    public MeterReading patchReading(@PathVariable String meterId,
                                     @Valid @RequestBody ReadingIngestRequest request) {
        return billingService.ingest(new ReadingIngestRequest(
                meterId, request.recordedAt(), request.kilowattHours()));
    }

    @DeleteMapping("/readings/{meterId}")
    public ResponseEntity<Void> deleteReadings(@PathVariable String meterId) {
        billingService.deleteReadings(meterId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invoices")
    public InvoiceResponse invoice(@RequestParam String customerId,
                                   @RequestParam String meterId,
                                   @RequestParam String tariffCode,
                                   @RequestParam LocalDate from,
                                   @RequestParam LocalDate to) {
        return billingService.generateInvoice(customerId, meterId, tariffCode, from, to);
    }

    @GetMapping("/meters/{meterId}/gaps")
    public List<MeterReading> gaps(@PathVariable String meterId,
                                   @RequestParam LocalDate from,
                                   @RequestParam LocalDate to) {
        return billingService.missingGaps(meterId, from, to);
    }
}
` },
    { path: `${p}/exception/GlobalExceptionHandler.java`, difficulty: "intermediate", topics: ["exception-handling"], code: `package com.codemuscle.energy.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    ProblemDetail conflict(RuntimeException exception) {
        HttpStatus status = exception instanceof IllegalStateException ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
        return ProblemDetail.forStatusAndDetail(status, exception.getMessage());
    }
}
` },
    { path: `${p}/config/EnergyConfiguration.java`, difficulty: "warmup", topics: ["spring-configuration"], code: `package com.codemuscle.energy.config;

import com.codemuscle.energy.model.Tariff;
import com.codemuscle.energy.repository.TariffRepository;
import com.codemuscle.energy.strategy.TariffCalculationStrategy;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;

@Configuration
public class EnergyConfiguration {
    @Bean
    TariffCalculationStrategy tariffCalculationStrategy() {
        return TariffCalculationStrategy.standard();
    }

    @Bean
    ApplicationRunner seedTariffs(TariffRepository tariffRepository) {
        return args -> tariffRepository.put(new Tariff("RES-FLAT", new BigDecimal("0.24"), new BigDecimal("0.35")));
    }
}
` },
    { path: `${p}/util/ConsumptionAggregator.java`, difficulty: "advanced", topics: ["streams","big-decimal","date-time"], code: `package com.codemuscle.energy.util;

import com.codemuscle.energy.model.MeterReading;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

public final class ConsumptionAggregator {
    private ConsumptionAggregator() {}

    public static Map<YearMonth, BigDecimal> byBillingMonth(Collection<MeterReading> readings) {
        return readings.stream().collect(Collectors.groupingBy(
                reading -> YearMonth.from(reading.recordedAt().atZone(ZoneOffset.UTC)),
                Collectors.mapping(MeterReading::kilowattHours,
                        Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
        ));
    }
}
` }
  ];
  writeManifest("energy-billing-system", {
    name: "Energy Consumption and Billing System",
    description: "Practise meter ingestion, BigDecimal billing, tariff strategies, duplicate detection, and time-safe aggregation.",
    difficulty: "advanced",
    order: 3,
    test: {
      path: "src/test/java/com/codemuscle/energy/strategy/TariffCalculationStrategyTest.java",
      code: `package com.codemuscle.energy.strategy;

import com.codemuscle.energy.model.Tariff;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.assertEquals;

class TariffCalculationStrategyTest {
    @Test
    void calculatesEnergyPlusStandingCharge() {
        var tariff = new Tariff("T", new BigDecimal("0.20"), new BigDecimal("1.00"));
        var amount = TariffCalculationStrategy.standard()
                .calculate(tariff, new BigDecimal("10"), LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 2));
        assertEquals(new BigDecimal("4.00"), amount);
    }
}
`
    }
  }, files);
}

// ─── 4. B2B SaaS ──────────────────────────────────────────────────────────────
{
  const p = "src/main/java/com/codemuscle/saas";
  const files = [
    { path: `${p}/SaasApplication.java`, difficulty: "warmup", topics: ["spring-boot"], code: `package com.codemuscle.saas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SaasApplication {
    public static void main(String[] args) {
        SpringApplication.run(SaasApplication.class, args);
    }
}
` },
    { path: `${p}/model/TenantStatus.java`, difficulty: "warmup", topics: ["enums"], code: `package com.codemuscle.saas.model;

public enum TenantStatus {
    TRIAL, ACTIVE, SUSPENDED, CANCELLED;

    public boolean allowsApiAccess() {
        return this == TRIAL || this == ACTIVE;
    }
}
` },
    { path: `${p}/model/Role.java`, difficulty: "warmup", topics: ["enums"], code: `package com.codemuscle.saas.model;

public enum Role {
    OWNER, ADMIN, MEMBER, READ_ONLY
}
` },
    { path: `${p}/model/Permission.java`, difficulty: "warmup", topics: ["enums"], code: `package com.codemuscle.saas.model;

public enum Permission {
    TENANT_MANAGE,
    USER_INVITE,
    BILLING_VIEW,
    FEATURE_TOGGLE,
    USAGE_READ
}
` },
    { path: `${p}/model/Plan.java`, difficulty: "intermediate", topics: ["records","big-decimal"], code: `package com.codemuscle.saas.model;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.Set;

public record Plan(String code, String name, BigDecimal monthlyPrice, int seatLimit, long apiCallLimit, Set<String> features) {
    public Plan {
        Objects.requireNonNull(code, "code");
        Objects.requireNonNull(monthlyPrice, "monthlyPrice");
        Objects.requireNonNull(features, "features");
        if (seatLimit <= 0 || apiCallLimit <= 0) {
            throw new IllegalArgumentException("Limits must be positive");
        }
    }
}
` },
    { path: `${p}/model/Tenant.java`, difficulty: "intermediate", topics: ["lombok","multi-tenancy"], code: `package com.codemuscle.saas.model;

import lombok.Builder;
import lombok.Getter;
import java.time.Instant;
import java.util.Objects;

@Getter
@Builder(toBuilder = true)
public class Tenant {
    private final String id;
    private final String slug;
    private final String displayName;
    private final TenantStatus status;
    private final String planCode;
    private final Instant createdAt;

    public Tenant withStatus(TenantStatus next) {
        return toBuilder().status(next).build();
    }
}
` },
    { path: `${p}/model/Subscription.java`, difficulty: "intermediate", topics: ["records","date-time","optional"], code: `package com.codemuscle.saas.model;

import java.time.Instant;
import java.util.Objects;

public record Subscription(String tenantId, String planCode, Instant startsAt, Instant endsAt, boolean autoRenew) {
    public Subscription {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(planCode, "planCode");
        Objects.requireNonNull(startsAt, "startsAt");
        if (endsAt != null && endsAt.isBefore(startsAt)) {
            throw new IllegalArgumentException("endsAt before startsAt");
        }
    }

    public boolean isActiveAt(Instant instant) {
        return !instant.isBefore(startsAt) && (endsAt == null || instant.isBefore(endsAt));
    }
}
` },
    { path: `${p}/model/UsageRecord.java`, difficulty: "intermediate", topics: ["records","date-time"], code: `package com.codemuscle.saas.model;

import java.time.YearMonth;
import java.util.Objects;

public record UsageRecord(String tenantId, YearMonth month, long apiCalls, int activeSeats) {
    public UsageRecord {
        Objects.requireNonNull(tenantId, "tenantId");
        Objects.requireNonNull(month, "month");
        if (apiCalls < 0 || activeSeats < 0) {
            throw new IllegalArgumentException("Usage cannot be negative");
        }
    }
}
` },
    { path: `${p}/tenant/TenantContext.java`, difficulty: "advanced", topics: ["multi-tenancy","concurrency"], code: `package com.codemuscle.saas.tenant;

import java.util.Objects;
import java.util.Optional;

public final class TenantContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(String tenantId) {
        CURRENT.set(Objects.requireNonNull(tenantId));
    }

    public static Optional<String> get() {
        return Optional.ofNullable(CURRENT.get());
    }

    public static String require() {
        return get().orElseThrow(() -> new IllegalStateException("Tenant context is missing"));
    }

    public static void clear() {
        CURRENT.remove();
    }
}
` },
    { path: `${p}/dto/TenantCreateRequest.java`, difficulty: "warmup", topics: ["validation","records"], code: `package com.codemuscle.saas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TenantCreateRequest(
        @NotBlank @Pattern(regexp = "[a-z0-9-]{3,40}") String slug,
        @NotBlank String displayName,
        @NotBlank String planCode
) {}
` },
    { path: `${p}/dto/TenantResponse.java`, difficulty: "warmup", topics: ["mapping"], code: `package com.codemuscle.saas.dto;

import com.codemuscle.saas.model.TenantStatus;
import java.time.Instant;
import java.util.Set;

public record TenantResponse(
        String id,
        String slug,
        String displayName,
        TenantStatus status,
        String planCode,
        Set<String> features,
        Instant createdAt
) {}
` },
    { path: `${p}/repository/TenantRepository.java`, difficulty: "advanced", topics: ["generics","multi-tenancy","collections"], code: `package com.codemuscle.saas.repository;

import com.codemuscle.saas.model.Tenant;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class TenantRepository {
    private final ConcurrentHashMap<String, Tenant> byId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> slugIndex = new ConcurrentHashMap<>();

    public Tenant save(Tenant tenant) {
        byId.put(tenant.getId(), tenant);
        slugIndex.put(tenant.getSlug(), tenant.getId());
        return tenant;
    }

    public Optional<Tenant> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }

    public Optional<Tenant> findBySlug(String slug) {
        return Optional.ofNullable(slugIndex.get(slug)).flatMap(this::findById);
    }

    public List<Tenant> findAll() {
        return new ArrayList<>(byId.values());
    }

    public void deleteById(String id) {
        Tenant removed = byId.remove(id);
        if (removed != null) {
            slugIndex.remove(removed.getSlug());
        }
    }
}
` },
    { path: `${p}/service/TenantFeatureService.java`, difficulty: "advanced", topics: ["multi-tenancy","collections","service-layer"], code: `package com.codemuscle.saas.service;

import com.codemuscle.saas.model.Permission;
import com.codemuscle.saas.model.Plan;
import com.codemuscle.saas.model.Role;
import com.codemuscle.saas.model.UsageRecord;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public class TenantFeatureService {
    private final Map<String, Plan> plans;
    private final Map<Role, Set<Permission>> rolePermissions;

    public TenantFeatureService(Map<String, Plan> plans) {
        this.plans = Map.copyOf(plans);
        this.rolePermissions = new EnumMap<>(Role.class);
        rolePermissions.put(Role.OWNER, EnumSet.allOf(Permission.class));
        rolePermissions.put(Role.ADMIN, EnumSet.of(Permission.USER_INVITE, Permission.FEATURE_TOGGLE, Permission.USAGE_READ, Permission.BILLING_VIEW));
        rolePermissions.put(Role.MEMBER, EnumSet.of(Permission.USAGE_READ));
        rolePermissions.put(Role.READ_ONLY, EnumSet.of(Permission.USAGE_READ, Permission.BILLING_VIEW));
    }

    public boolean hasFeature(String planCode, String feature) {
        Plan plan = plans.get(planCode);
        return plan != null && plan.features().contains(feature);
    }

    public boolean hasPermission(Role role, Permission permission) {
        return rolePermissions.getOrDefault(role, Set.of()).contains(permission);
    }

    public boolean withinLimits(Plan plan, UsageRecord usage) {
        return usage.activeSeats() <= plan.seatLimit() && usage.apiCalls() <= plan.apiCallLimit();
    }
}
` },
    { path: `${p}/service/TenantService.java`, difficulty: "warmup", topics: ["service-layer"], code: `package com.codemuscle.saas.service;

import com.codemuscle.saas.dto.TenantCreateRequest;
import com.codemuscle.saas.dto.TenantResponse;
import com.codemuscle.saas.model.UsageRecord;
import com.codemuscle.saas.model.TenantStatus;
import java.util.List;
import java.util.Optional;

public interface TenantService {
    TenantResponse create(TenantCreateRequest request);
    TenantResponse find(String id);
    List<TenantResponse> findAll();
    TenantResponse replace(String id, TenantCreateRequest request);
    TenantResponse changeStatus(String id, TenantStatus status);
    void delete(String id);
    Optional<TenantResponse> findActiveSubscription(String tenantId);
    void assertUsageAllowed(String tenantId, UsageRecord usage);
}
` },
    { path: `${p}/service/impl/TenantServiceImpl.java`, difficulty: "advanced", topics: ["service-layer","multi-tenancy","optional","streams"], code: `package com.codemuscle.saas.service.impl;

import com.codemuscle.saas.dto.TenantCreateRequest;
import com.codemuscle.saas.dto.TenantResponse;
import com.codemuscle.saas.model.Plan;
import com.codemuscle.saas.model.Subscription;
import com.codemuscle.saas.model.Tenant;
import com.codemuscle.saas.model.TenantStatus;
import com.codemuscle.saas.model.UsageRecord;
import com.codemuscle.saas.repository.TenantRepository;
import com.codemuscle.saas.service.TenantFeatureService;
import com.codemuscle.saas.service.TenantService;
import com.codemuscle.saas.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {
    private final TenantRepository tenantRepository;
    private final TenantFeatureService featureService;
    private final Map<String, Plan> plans;
    private final Map<String, Subscription> subscriptions = new ConcurrentHashMap<>();

    @Override
    public TenantResponse create(TenantCreateRequest request) {
        if (tenantRepository.findBySlug(request.slug()).isPresent()) {
            throw new IllegalStateException("Slug already taken");
        }
        Plan plan = Optional.ofNullable(plans.get(request.planCode()))
                .orElseThrow(() -> new IllegalArgumentException("Unknown plan"));
        Tenant tenant = Tenant.builder()
                .id(UUID.randomUUID().toString())
                .slug(request.slug())
                .displayName(request.displayName())
                .status(TenantStatus.TRIAL)
                .planCode(plan.code())
                .createdAt(Instant.now())
                .build();
        tenantRepository.save(tenant);
        subscriptions.put(tenant.getId(), new Subscription(tenant.getId(), plan.code(), Instant.now(), null, true));
        return toResponse(tenant);
    }

    @Override
    public TenantResponse find(String id) {
        return tenantRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
    }

    @Override
    public java.util.List<TenantResponse> findAll() {
        return tenantRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public TenantResponse replace(String id, TenantCreateRequest request) {
        Tenant current = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        Plan plan = Optional.ofNullable(plans.get(request.planCode()))
                .orElseThrow(() -> new IllegalArgumentException("Unknown plan"));
        Tenant replacement = current.toBuilder()
                .slug(request.slug())
                .displayName(request.displayName())
                .planCode(plan.code())
                .build();
        return toResponse(tenantRepository.save(replacement));
    }

    @Override
    public TenantResponse changeStatus(String id, TenantStatus status) {
        Tenant current = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        return toResponse(tenantRepository.save(current.withStatus(status)));
    }

    @Override
    public void delete(String id) {
        tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        tenantRepository.deleteById(id);
        subscriptions.remove(id);
    }

    @Override
    public Optional<TenantResponse> findActiveSubscription(String tenantId) {
        return Optional.ofNullable(subscriptions.get(tenantId))
                .filter(subscription -> subscription.isActiveAt(Instant.now()))
                .flatMap(subscription -> tenantRepository.findById(tenantId))
                .filter(tenant -> tenant.getStatus().allowsApiAccess())
                .map(this::toResponse);
    }

    @Override
    public void assertUsageAllowed(String tenantId, UsageRecord usage) {
        TenantContext.set(tenantId);
        try {
            Tenant tenant = tenantRepository.findById(tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
            if (!tenant.getStatus().allowsApiAccess()) {
                throw new IllegalStateException("Tenant suspended");
            }
            Plan plan = plans.get(tenant.getPlanCode());
            if (plan == null || !featureService.withinLimits(plan, usage)) {
                throw new IllegalStateException("Plan limits exceeded");
            }
        } finally {
            TenantContext.clear();
        }
    }

    private TenantResponse toResponse(Tenant tenant) {
        Plan plan = plans.get(tenant.getPlanCode());
        return new TenantResponse(
                tenant.getId(),
                tenant.getSlug(),
                tenant.getDisplayName(),
                tenant.getStatus(),
                tenant.getPlanCode(),
                plan == null ? Set.of() : plan.features(),
                tenant.getCreatedAt()
        );
    }
}
`.replace("plan == null ? Set.of() : plan.features(),", "plan == null ? java.util.Set.of() : plan.features(),") },
    { path: `${p}/mapper/TenantMapper.java`, difficulty: "intermediate", topics: ["mapping","mapstruct","multi-tenancy"], code: `package com.codemuscle.saas.mapper;

import com.codemuscle.saas.dto.TenantResponse;
import com.codemuscle.saas.model.Tenant;
import org.mapstruct.Mapper;
import java.util.Set;

@Mapper(componentModel = "spring")
public interface TenantMapper {
    TenantResponse toResponse(Tenant tenant, Set<String> features);
}
` },
    { path: `${p}/controller/TenantController.java`, difficulty: "intermediate", topics: ["spring-controller","multi-tenancy","validation"], code: `package com.codemuscle.saas.controller;

import com.codemuscle.saas.dto.TenantCreateRequest;
import com.codemuscle.saas.dto.TenantResponse;
import com.codemuscle.saas.model.UsageRecord;
import com.codemuscle.saas.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {
    private final TenantService tenantService;

    @PostMapping
    public ResponseEntity<TenantResponse> create(@Valid @RequestBody TenantCreateRequest request) {
        TenantResponse response = tenantService.create(request);
        return ResponseEntity.created(URI.create("/api/tenants/" + response.id())).body(response);
    }

    @GetMapping("/{id}")
    public TenantResponse find(@PathVariable String id) {
        return tenantService.find(id);
    }

    @GetMapping
    public List<TenantResponse> findAll() {
        return tenantService.findAll();
    }

    @PutMapping("/{id}")
    public TenantResponse replace(@PathVariable String id,
                                  @Valid @RequestBody TenantCreateRequest request) {
        return tenantService.replace(id, request);
    }

    @PatchMapping("/{id}/status")
    public TenantResponse changeStatus(@PathVariable String id,
                                       @RequestParam com.codemuscle.saas.model.TenantStatus status) {
        return tenantService.changeStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        tenantService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/usage/assert")
    public ResponseEntity<Void> assertUsage(@PathVariable String id, @RequestBody UsageRecord usage) {
        tenantService.assertUsageAllowed(id, usage == null
                ? new UsageRecord(id, YearMonth.now(), 0, 0)
                : usage);
        return ResponseEntity.noContent().build();
    }
}
` },
    { path: `${p}/exception/GlobalExceptionHandler.java`, difficulty: "intermediate", topics: ["exception-handling"], code: `package com.codemuscle.saas.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail notFound(IllegalArgumentException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    ProblemDetail conflict(IllegalStateException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }
}
` },
    { path: `${p}/config/SaasConfiguration.java`, difficulty: "intermediate", topics: ["spring-configuration","multi-tenancy"], code: `package com.codemuscle.saas.config;

import com.codemuscle.saas.model.Plan;
import com.codemuscle.saas.service.TenantFeatureService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

@Configuration
public class SaasConfiguration {
    @Bean
    Map<String, Plan> plans() {
        return Map.of(
                "starter", new Plan("starter", "Starter", new BigDecimal("49.00"), 5, 50_000L, Set.of("basic-api")),
                "growth", new Plan("growth", "Growth", new BigDecimal("199.00"), 25, 500_000L, Set.of("basic-api", "webhooks", "sso"))
        );
    }

    @Bean
    TenantFeatureService tenantFeatureService(Map<String, Plan> plans) {
        return new TenantFeatureService(plans);
    }
}
` },
    { path: `${p}/util/UsageAggregator.java`, difficulty: "advanced", topics: ["streams","multi-tenancy"], code: `package com.codemuscle.saas.util;

import com.codemuscle.saas.model.UsageRecord;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

public final class UsageAggregator {
    private UsageAggregator() {}

    public static Map<String, Long> totalApiCallsByTenant(Collection<UsageRecord> records) {
        return records.stream().collect(Collectors.groupingBy(
                UsageRecord::tenantId,
                Collectors.summingLong(UsageRecord::apiCalls)
        ));
    }

    public static long totalSeats(Collection<UsageRecord> records) {
        return records.stream().mapToLong(UsageRecord::activeSeats).sum();
    }
}
` }
  ];
  writeManifest("b2b-saas-platform", {
    name: "Multi-Tenant B2B SaaS Platform",
    description: "Practise tenant isolation, subscriptions, feature flags, role permissions, and usage-limit enforcement.",
    difficulty: "advanced",
    order: 4,
    test: {
      path: "src/test/java/com/codemuscle/saas/service/TenantFeatureServiceTest.java",
      code: `package com.codemuscle.saas.service;

import com.codemuscle.saas.model.Permission;
import com.codemuscle.saas.model.Plan;
import com.codemuscle.saas.model.Role;
import com.codemuscle.saas.model.UsageRecord;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Map;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

class TenantFeatureServiceTest {
    @Test
    void enforcesPlanLimitsAndPermissions() {
        Plan plan = new Plan("starter", "Starter", new BigDecimal("49.00"), 5, 100L, Set.of("basic-api"));
        var service = new TenantFeatureService(Map.of("starter", plan));
        assertTrue(service.hasFeature("starter", "basic-api"));
        assertTrue(service.hasPermission(Role.ADMIN, Permission.USER_INVITE));
        assertFalse(service.withinLimits(plan, new UsageRecord("t1", YearMonth.now(), 200, 1)));
    }
}
`
    }
  }, files);
}

console.log("Generated training projects under", root);
