package com.kb.ltt.api.exception;

public class OptimisticLockException extends BusinessException {

    public OptimisticLockException() {
        super("MSG-ERR-LOCK", "Ban ghi da bi thay doi tu phien khac. Vui long tai lai truoc khi tiep tuc");
    }
}
