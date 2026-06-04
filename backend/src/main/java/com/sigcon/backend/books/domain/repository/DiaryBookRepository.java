package com.sigcon.backend.books.domain.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sigcon.backend.books.domain.model.DiaryBook;
import com.sigcon.backend.books.domain.model.GeneralLedger;

public interface DiaryBookRepository extends JpaRepository<DiaryBook, Long>, JpaSpecificationExecutor<DiaryBook> {

    @Query("""
        SELECT db
        FROM DiaryBook db
        WHERE db.date = :date
        AND db.generalLedger = :generalLedger
        AND db.deletedAt IS NULL
    """)
    Optional<DiaryBook> findByDate(@Param("date") LocalDate date, @Param("generalLedger") GeneralLedger generalLedger);
}
